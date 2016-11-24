namespace GreyTide
module GreyTide =
    open Suave
    open Suave.Filters
    open Suave.Operators
    open Newtonsoft.Json.Linq
    open Newtonsoft.Json
    open System.Configuration
    open GreyTide.Data
    open GreyTide.InitData
    open Suave.State.CookieStateStore
    open Suave.Cookie
    open Suave.Authentication
    open Suave.Writers

    type SaveBundle = { SaveBundle:JObject }
    type InitConfig = { DatabaseId : string
                        ConnectionUri : string
                        ConnectionKey : string
                        DocumentCollectionId : string;
                        OAuthGId : string;
                        OAuthGS : string
                        OAuthFId : string;
                        OAuthFS : string }

    let JSON v =
        let jsonSerializerSettings = Breeze.ContextProvider.BreezeConfig.Instance.GetJsonSerializerSettings()
        JsonConvert.SerializeObject(v, jsonSerializerSettings)
        |> Successful.OK
        >=> Writers.setMimeType "application/json; charset=utf-8"

    let getFormData (request:HttpRequest) key =
        match request.formData key with
        | Choice1Of2 x  -> x
        | _             -> ""

    let getSaveBundle req = 
        let get = req.rawForm |> System.Text.Encoding.UTF8.GetString
        match { SaveBundle = JObject.Parse (get) } with
        | x when isNull x.SaveBundle -> Choice2Of2 "Could not parse"
        | x -> Choice1Of2 x.SaveBundle
        
    let getInitConfig req = 
        let get = getFormData req
        { DatabaseId           = get "DatabaseId"
          ConnectionUri        = get "ConnectionUri"
          ConnectionKey        = get "ConnectionKey"
          DocumentCollectionId = get "UserToken" 
          OAuthGId             = get "OAuthGId"
          OAuthGS              = get "OAuthGS"
          OAuthFId             = get "OAuthFId"
          OAuthFS              = get "OAuthFS"  }

    let tryOrNever f x =
        try
            f x |> Choice1Of2
        with _ -> WebPart.never |> Choice2Of2

    module private Option =
        let iff b x =
            if b then Some x else None
    
    let doIf test (x : HttpContext) =
        async.Return (Option.iff (test x) x)

    let request' f g = 
        request ( f
                    >> Choice.mapSnd (fun _ -> WebPart.never)
                    >> Choice.bind (tryOrNever g)
                    >> Choice.fold id id)

    let setSettings kvp =
        let config = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None)
        List.iter (fun (key,value) -> 
            match config.AppSettings.Settings.[key] with
            | null -> config.AppSettings.Settings.Add(key,value)
            | setting -> setting.Value <- value) kvp
        config.Save(ConfigurationSaveMode.Modified)
        ConfigurationManager.RefreshSection("appSettings")

    let setInitConfig config =
        setSettings 
            [ "DatabaseId"   , config.DatabaseId   
              "ConnectionUri", config.ConnectionUri
              "ConnectionKey", config.ConnectionKey
              "DocumentCollectionId", config.DocumentCollectionId
              "OAuthGId", config.OAuthGId
              "OAuthGS", config.OAuthGS 
              "OAuthFId", config.OAuthFId
              "OAuthFS", config.OAuthFS ]

    let isNotInit _ = (System.String.IsNullOrWhiteSpace(InitData.getSetting "ConnectionUri"))

    let wire0 data _ = data |> JSON
    let wire data _ = data client.Value |> JSON
    let wire2 data r  = data client.Value r |> JSON


    
    type Session = 
        | NoSession
        | UserToken of string

    let session f = 
        statefulForSession
        >=> context (fun x -> 
            match x |> HttpContext.state with
            | None ->
                printfn "Didn't find HttpContext state"
                f NoSession
            | Some state ->
                match state.get "usertoken" with
                | Some usertoken -> 
                    printfn "found usertoken %s" usertoken
                    f (UserToken usertoken)
                | _ -> 
                    printfn "User token not found"
                    f NoSession)
    let noCache = 
        setHeader "Cache-Control" "no-cache, no-store, must-revalidate"
          >=> setHeader "Pragma" "no-cache"
          >=> setHeader "Expires" "0"

    let sessionStore setF = 
        context (fun x ->
            match HttpContext.state x with
            | Some state -> setF state
            | None -> never)

    let reset =
        unsetPair SessionAuthCookie
        >=> unsetPair StateCookie
        >=> Redirection.FOUND "index.html"
   
    let mapSession2 fSuccess fFailure = function 
        | NoSession -> 
            printfn "No session in mapsession2"
            fFailure
        | UserToken(userToken) -> 
            printfn "Found user token"
            fSuccess userToken

    let orElsebadRequest f = mapSession2 f (RequestErrors.BAD_REQUEST "No Session Found")

    let storeUserToken id = statefulForSession >=> sessionStore (fun store -> store.set "usertoken" id)

    let setup  items  = 
        
            (GET >=> request (fun _ -> doIf (isNotInit)) >=> Files.browseFileHome "setup.html"  >=> noCache )  
            :: (POST >=> path "/setup.html" >=> request (fun r -> getInitConfig r |> setInitConfig; Redirection.redirect "/" )  )  
            :: (GET >=> path "/setup.html" >=> request (fun _ -> doIf (isNotInit >> not)) >=> Redirection.redirect "/"    )  
            :: items

    let mainApplication = 
        let app usertoken =
            [ 
                
                GET >=> choose [    path "/" >=> Files.browseFileHome "index.html" >=> noCache
                                    path "/tide/v1/Tide"   >=> request (v1Models usertoken |> wire0 ) 
                                    path "/tide/v1/States" >=> request (wire0 v1States) 
                                    path "/tide/v2/Models" >=> request (v2Models usertoken |> wire ) 
                                    path "/tide/v2/States" >=> request (wire v2States)  ]
                POST >=> choose [ 
                                    path "/tide/v1/SaveChanges" >=> request' getSaveBundle (v1SaveChanges usertoken |> wire2 ) 
                                    path "/tide/v2/SaveChanges" >=>  request' getSaveBundle (v2SaveChanges usertoken |> wire2 ) ]
                Files.browseHome
            ] 
            |> choose
        app |> orElsebadRequest |> session

    let greyTide = 
        let buttonstToLogin = session (mapSession2 (fun _ -> never) (Files.browseFileHome "signin.html")) >=> noCache
        #if INTERACTIVE
        let app = Files.browseHome :: [storeUserToken "myusertoken" >=> mainApplication]
        #else
        let app = (pathRegex "(.*)\.(css|png|gif|js)" >=> Files.browseHome) :: Security.secure storeUserToken buttonstToLogin mainApplication
        #endif
        setup app |> choose
        
