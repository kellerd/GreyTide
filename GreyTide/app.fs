namespace GreyTide
module App = 
    open GreyTide
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
            | [|port';homeFolder'|] -> uint16 port',(Some ( Environment.ExpandEnvironmentVariables homeFolder'))
            | [|port'|] -> uint16 port',(Some Environment.CurrentDirectory)
            | _ -> 8083us,(Some Environment.CurrentDirectory)

//            loadFilesIfTheyDontExist client.Value (Data.repo.States.Value.ToList()) (fun query -> query.Where(fun (sc:V2.StateCollection) -> sc.``type`` = typeof<V2.StateCollection>.FullName) |> Seq.isEmpty |> not)
//            loadFilesIfTheyDontExist client.Value (Data.repo.Models.Value.ToList()) (fun query -> query.Where(fun (sc:V2.Model) -> sc.``type`` = typeof<V2.Model>.FullName) |> Seq.isEmpty |> not)

        let config =
            { config with
                    bindings = [ HttpBinding.create HTTP IPAddress.Loopback port ]
                    listenTimeout = TimeSpan.FromMilliseconds 3000.
                    homeFolder = homeFolder }
        startWebServer config greyTide 
        0
    #endif


