namespace GreyTideSuave
module App = 
    open GreyTideSuave.GreyTide
    open GreyTideSuave.InitData
    open Suave
    open System
    open System.Net

    #if INTERACTIVE
    startWebServer config (greyTide client)
    #else
    [<EntryPoint>]

    let main [| port |] =
        let config =
            { config with
                  bindings = [ HttpBinding.create HTTP IPAddress.Loopback (uint16 port) ]
                  listenTimeout = TimeSpan.FromMilliseconds 3000. }
        startWebServer config (greyTide client)
        0
    #endif


