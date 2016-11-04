open System

if (AppDomain.CurrentDomain.BaseDirectory = @"C:\Program Files (x86)\Microsoft SDKs\F#\4.0\Framework\v4.0\") then
    AppDomain.CurrentDomain.SetData("APPBASE", @"C:\Users\diese\Source\Repos\GreyTide\GreyTideSuave")

#I @"..\packages\"
#r @"Suave\lib\net40\Suave.dll"
#load "data.fsx"

open Suave
open Suave.Filters
open Suave.Operators
open Suave.Json
open Newtonsoft.Json.Linq
open Newtonsoft.Json
open InitData
open Data


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

let request' f g = 
    request ( f
               >> Choice.mapSnd (fun _ -> WebPart.never)
               >> Choice.bind (tryOrNever g)
               >> Choice.fold id id)

let greyTide client = 
    choose [ GET >=> choose [ 
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


startWebServer {defaultConfig with homeFolder = Some @"C:\Users\diese\Source\Repos\GreyTide\GreyTide\" } (greyTide client)