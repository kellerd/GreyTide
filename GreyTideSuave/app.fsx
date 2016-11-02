#I @"..\packages\"
#r @"Suave\lib\net40\Suave.dll"
#r @"Newtonsoft.Json\lib\net45\Newtonsoft.Json.dll"
#load "loadData.fsx"

open Suave
open Suave.Filters
open Suave.Operators
open Suave.Json
open System
open Newtonsoft.Json.Linq
open GreyTide.data
open Newtonsoft.Json
open Breeze.ContextProvider
open Microsoft.Azure.Documents.Linq
open Microsoft.Azure.Documents.Client
open GreyTide.Models.V2
open System.Linq
open LoadData
open GreyTide.Models

GreyTideDataService.App_Start.AutoMapperConfig.RegisterAutoMapperPreStart()

let getItems (client:DocumentClient) : IQueryable<'T :> ITypeable> = 
    let database = getDatabase()
    let documentCollection = getDocumentCollection database
    client.CreateDocumentQuery<'T>(documentCollection.SelfLink).
        Where(fun sc -> sc.``type`` = typeof<'T>.FullName)

let v2Models client () : IQueryable<GreyTide.Models.V2.Model> = getItems client
let v2States client () : IQueryable<GreyTide.Models.V2.StateCollection> = getItems client
let v2SaveChanges (client:DocumentClient) (saveBundle:JObject) = 
    let entityInfo = SaveBundleToSaveMap.Convert(saveBundle);
    let saveOptions = SaveBundleToSaveMap.ExtractSaveOptions(saveBundle);
    let database = getDatabase()
    let documentCollection = getDocumentCollection database

    //Store in azure
    let entities = 
        entityInfo 
        |> Seq.collect (fun f -> f.Value)
        |> Seq.map (fun item -> match (item.EntityState, item.Entity) with
                                | (state, entity) when state = EntityState.Modified || state = EntityState.Added -> 
                                    let result = client.UpsertDocumentAsync(documentCollection.SelfLink, entity).Result
                                    SaveChangesResult ( Document = result.Resource, StatusCode = result.StatusCode )
                                | state, (:? IIdentifyable as entity) when state = EntityState.Deleted ->
                                    let result = 
                                        client.CreateDocumentQuery(documentCollection.SelfLink).Where(fun sc -> sc.Id = entity.id.ToString()).ToArray().FirstOrDefault() 
                                        |> Option.ofObj
                                        |> Option.map (fun doc -> let result = client.DeleteDocumentAsync(doc.SelfLink).Result
                                                                  SaveChangesResult ( Document = null, StatusCode = result.StatusCode ))
                                    defaultArg result (SaveChangesResult ( Document = null, StatusCode = System.Net.HttpStatusCode.NoContent ))
                                | _,_ -> 
                                    SaveChangesResult ( Document = null, StatusCode = System.Net.HttpStatusCode.NotImplemented ))

    let keyMappings = ResizeArray<KeyMapping>();
    let entitiesList = 
        entities
        |> Seq.map(fun e -> defaultArg (Option.ofObj (e.Document :> obj)) (JsonConvert.DeserializeObject(e.Document.ToString(), Type.GetType(e.Document.GetPropertyValue<string>("type")))))
        |> Seq.filter(isNull >> not)
        |> ResizeArray
    let errors = 
        entities
        |> Seq.filter(fun result  -> result.StatusCode <> System.Net.HttpStatusCode.Created && result.StatusCode <> System.Net.HttpStatusCode.OK && result.StatusCode <> System.Net.HttpStatusCode.NoContent)
        |> Seq.map (fun e  -> e.Document :> obj)
        |> ResizeArray
    SaveResult(Entities = entitiesList, Errors = (if errors.Count = 0 then null else errors), KeyMappings = keyMappings)
    |> toJson
    |> Successful.ok

let v1SaveChanges = v2SaveChanges 

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
                        path "/tide/v1/Tide" >=> mapJson (GreyTide.Repo.Models.Value.ToList)
                        path "/tide/v1/States" >=> mapJson (GreyTide.Repo.States.Value.ToList)
                        path "/tide/v2/Models" >=> mapJson (v2Models client)
                        path "/tide/v2/States" >=> mapJson (v2States client)
                        Files.browseHome 
                     ]
             POST >=> choose [ path "/tide/v1/SaveChanges" >=> request' getSaveBundle (v1SaveChanges client) 
                               path "/tide/v2/SaveChanges" >=>  request' getSaveBundle (v2SaveChanges client) ]
            ]


startWebServer {defaultConfig with homeFolder = Some @"C:\Users\kellerd\Source\Repos\GreyTide\GreyTide\" } (greyTide client)