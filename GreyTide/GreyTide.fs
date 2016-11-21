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

    #if INTERACTIVE
    let config = {defaultConfig with homeFolder = Some (System.IO.Path.Combine(__SOURCE_DIRECTORY__.Substring(0, __SOURCE_DIRECTORY__.LastIndexOf(System.IO.Path.DirectorySeparatorChar)) ,@"GreyTide")) }
    #else
    let config = 
        if not (System.IO.Directory.Exists(System.IO.Path.Combine(__SOURCE_DIRECTORY__, "app"))) then
            let path = System.IO.Path.Combine(__SOURCE_DIRECTORY__.Substring(0, __SOURCE_DIRECTORY__.LastIndexOf(System.IO.Path.DirectorySeparatorChar)) ,@"GreyTide")
            {defaultConfig with homeFolder = Some (path) }
        else defaultConfig

    #endif

    type SaveBundle = { SaveBundle:JObject }
    type InitConfig = { DatabaseId : string
                        ConnectionUri : string
                        ConnectionKey : string
                        UserToken : string }

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
        { DatabaseId = get "DatabaseId"
          ConnectionUri = get "ConnectionUri"
          ConnectionKey = get "ConnectionKey"
          UserToken = get "UserToken" }

    let tryOrNever f x =
        try
            f x |> Choice1Of2
        with e -> WebPart.never |> Choice2Of2

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
              "UserToken"    , config.UserToken ]

    let isNotInit _ = (System.String.IsNullOrWhiteSpace(InitData.getSetting "ConnectionUri"))

    let wire0 data _ = 
        data 
        |> JSON

    let wire data _ = 
        data client.Value 
        |> JSON

    let wire2 data r  = 
        data client.Value r
        |> JSON
    lrt setup = 
        GET >=> request (fun _ -> doIf (isNotInit)) >=> Files.browseFileHome "setup.html"
            POST >=> path "/setup.html" >=> request (fun r -> getInitConfig r |> setInitConfig; Files.browseFileHome "index.html" )
            
    let greyTide = 
        choose [ 
           GET >=> choose [ 
                                path "/" <|> (path "/setup.html" >=> request (fun _ -> doIf (isNotInit >> not)))  >=> Files.browseFileHome "index.html"
                                path "/tide/v1/Tide"   >=> request (wire0 v1Models) 
                                path "/tide/v1/States" >=> request (wire0 v1States) 
                                path "/tide/v2/Models" >=> request (wire v2Models) 
                                path "/tide/v2/States" >=> request (wire v2States) 
                                Files.browseHome 
                             ]
            POST >=> choose [ 
                              path "/tide/v1/SaveChanges" >=> request' getSaveBundle (wire2 v1SaveChanges) 
                              path "/tide/v2/SaveChanges" >=>  request' getSaveBundle (wire2 v2SaveChanges) ]
        ]

