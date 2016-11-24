namespace GreyTide
module App = 
    open GreyTide
    open Suave
    open System
    open System.Net
    open InitData
    open System.Linq
    open GreyTide.Models

    #if INTERACTIVE
    let config = {defaultConfig with homeFolder = Some (System.IO.Path.Combine(__SOURCE_DIRECTORY__.Substring(0, __SOURCE_DIRECTORY__.LastIndexOf(System.IO.Path.DirectorySeparatorChar)) ,@"GreyTide")) }
    startWebServer config greyTide 
    #else

    let config = 
        if not (System.IO.Directory.Exists(System.IO.Path.Combine(__SOURCE_DIRECTORY__, "app"))) then
            let path = System.IO.Path.Combine(__SOURCE_DIRECTORY__.Substring(0, __SOURCE_DIRECTORY__.LastIndexOf(System.IO.Path.DirectorySeparatorChar)) ,@"GreyTideAssets")
            {defaultConfig with homeFolder = Some (path) }
        else defaultConfig

    [<EntryPoint>]
    let main args =
        let (port,homeFolder) = 
            match args with 
            | [|port';homeFolder'|] -> uint16 port',(Some ( Environment.ExpandEnvironmentVariables homeFolder'))
            | [|port'|] -> uint16 port',(Some Environment.CurrentDirectory)
            | _ -> 8083us,(Some Environment.CurrentDirectory)      

        let config =
            { config with
                    bindings = [ HttpBinding.create HTTP IPAddress.Loopback port ]
                    listenTimeout = TimeSpan.FromMilliseconds 3000.
                    homeFolder = homeFolder }
        startWebServer config greyTide 
        0
    #endif


