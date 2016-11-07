namespace GreyTideSuave
module GreyTide =
    open Suave
    #if INTERACTIVE
    let config = {defaultConfig with homeFolder = Some (System.IO.Path.Combine(__SOURCE_DIRECTORY__.Substring(0, __SOURCE_DIRECTORY__.LastIndexOf(System.IO.Path.DirectorySeparatorChar)) ,@"GreyTide")) }
    #else
    let config = 
        if not System.IO.Directory.Exists(System.IO.Path.Combine(__SOURCE_DIRECTORY__, "app")) then
            let path = System.IO.Path.Combine(__SOURCE_DIRECTORY__.Substring(0, __SOURCE_DIRECTORY__.LastIndexOf(System.IO.Path.DirectorySeparatorChar)) ,@"GreyTide")
            {defaultConfig with homeFolder = Some (path) }
        else defaultConfig

    #endif
    open Suave.Filters
    open Suave.Operators
    open GreyTideSuave.Data
    open Newtonsoft.Json.Linq
    open Newtonsoft.Json
    open System.Configuration

    let JSON v =
        let jsonSerializerSettings = new JsonSerializerSettings()
        jsonSerializerSettings.ContractResolver <- new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver()

        JsonConvert.SerializeObject(v, jsonSerializerSettings)
        |> Successful.OK
        >=> Writers.setMimeType "application/json; charset=utf-8"

    let getSaveBundle = Suave.Model.Binding.form "saveBundle" (JObject.Parse >> Choice1Of2) 

    let tryOrNever f x =
        try
            f x |> Choice1Of2
        with _ -> WebPart.never |> Choice2Of2

    module private Option =
        let iff b x =
            if b then Some x else None
    
    let check test (x : HttpContext) =
        async.Return (Option.iff (test) x)

    let request' f g = 
        request ( f
                    >> Choice.mapSnd (fun _ -> WebPart.never)
                    >> Choice.bind (tryOrNever g)
                    >> Choice.fold id id)

    let setSetting (key:string) (value:string) =
        let config = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None)
        config.AppSettings.Settings.[key].Value <- value
        config.Save(ConfigurationSaveMode.Modified)
        ConfigurationManager.RefreshSection("appSettings")
    let greyTide client = 
        choose [ 
            GET >=> choose [ 
                                path "/" >=> check (String.isEmpty(InitData.getSetting "ConnectionUri")) >>= setup >=> Files.browseFileHome "setup.html"
                                path "/" >=> Files.browseFileHome "index.html"
                                path "/tide/v1/Tide"   >=> request (fun _ -> JSON (v1Models) )
                                path "/tide/v1/States" >=> request (fun _ -> JSON (v1States) )
                                path "/tide/v2/Models" >=> request (fun _ -> JSON (v2Models client)                  ) 
                                path "/tide/v2/States" >=> request (fun _ -> JSON (v2States client)                  ) 
                                Files.browseHome 
                             ]
            POST >=> choose [ path "/tide/v1/SaveChanges" >=> request' getSaveBundle (v1SaveChanges client >> JSON) 
                              path "/tide/v2/SaveChanges" >=>  request' getSaveBundle (v2SaveChanges client >> JSON) ]
        ]

