namespace GreyTideSuave
module App = 
    open GreyTideSuave.GreyTide
    open GreyTideSuave.InitData
    open Suave
    #if INTERACTIVE
    startWebServer config (greyTide client)
    #else
    [<EntryPoint>]
    let main argv =
        startWebServer config (greyTide client)
        0
    #endif


