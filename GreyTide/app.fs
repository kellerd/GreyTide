namespace GreyTide
module App = 
    open GreyTide
    open GreyTide.InitData
    open GreyTide.Models
    open Suave
    open System
    open System.Net
    open System.Linq

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
        try
            loadFilesIfTheyDontExist client.Value (Data.repo.States.Value.ToList()) (fun query -> query.Where(fun (sc:V2.StateCollection) -> sc.``type`` = typeof<V2.StateCollection>.FullName) |> Seq.isEmpty |> not)
            loadFilesIfTheyDontExist client.Value (Data.repo.Models.Value.ToList()) (fun query -> query.Where(fun (sc:V2.Model) -> sc.``type`` = typeof<V2.Model>.FullName) |> Seq.isEmpty |> not)

            let config =
                { config with
                        bindings = [ HttpBinding.create HTTP IPAddress.Loopback port ]
                        listenTimeout = TimeSpan.FromMilliseconds 3000.
                        homeFolder = homeFolder }
            startWebServer config greyTide
        with e ->
            printfn "%A" e
        0
    #endif


