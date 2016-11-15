namespace GreyTideSuave
module App = 
    open GreyTideSuave.GreyTide
    open Suave
    open System
    open System.Net

    #if INTERACTIVE
    startWebServer config greyTide 
    #else
    [<EntryPoint>]

    let main args =
        let (port,homeFolder) = 
            match args with 
            | [|port';homeFolder'|] -> uint16 port',Some homeFolder'
            | [|port'|] -> uint16 port',config.homeFolder
            | _ -> 8083us,config.homeFolder
        let config =
            { config with
                    bindings = [ HttpBinding.create HTTP IPAddress.Loopback port ]
                    listenTimeout = TimeSpan.FromMilliseconds 3000.
                    homeFolder = homeFolder }
        startWebServer config greyTide
        0
    #endif


