namespace GreyTideSuave
module App = 
    open GreyTideSuave.GreyTide
    open GreyTideSuave.InitData
    open Suave
    open System
    open System.Net

    #if INTERACTIVE
    startWebServer config greyTide 
    #else
    [<EntryPoint>]

    let main args =
        let port = 
            match args with 
            | [|port'|] -> uint16 port'
            | _ -> 8083us
        try
            let config =
                { config with
                      bindings = [ HttpBinding.create HTTP IPAddress.Loopback port ]
                      listenTimeout = TimeSpan.FromMilliseconds 3000. }
            startWebServer config greyTide
        with e -> 
            printfn "%A" e
        0
    #endif


