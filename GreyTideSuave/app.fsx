// Learn more about F# at http://fsharp.net
// See the 'F# Tutorial' project for more help.
#I @"..\packages\"
#r @"Suave\lib\net40\Suave.dll"
open Suave
open Suave.Filters
open Suave.Operators
open Suave.Successful

let greyTide = 
    choose [ 
            GET >=> choose [
                        path "/" >=> Files.file "index.html"
                        Files.browseHome 
                    ]
            OK "Hello World!"]
            
startWebServer {defaultConfig with homeFolder = Some @"C:\Users\KELLERD\Source\Repos\GreyTide\GreyTideSuave" } greyTide