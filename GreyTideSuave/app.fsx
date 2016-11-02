#I @"..\packages\"
#r @"Suave\lib\net40\Suave.dll"
#r "System.Configuration.dll"
#r @"Microsoft.Azure.DocumentDB\lib\net40\Microsoft.Azure.Documents.Client.dll"
#r @"C:\Users\diese\Source\Repos\GreyTide\GreyTide\bin\GreyTide.dll"
#r @"Breeze.Server.ContextProvider\lib\Breeze.ContextProvider.dll"
#r @"Newtonsoft.Json\lib\net45\Newtonsoft.Json.dll"

open Suave
open Suave.Filters
open Suave.Operators
open Suave.Json
open System.Linq
open System
open System.Configuration
open Microsoft.Azure.Documents
open Microsoft.Azure.Documents.Linq
open Microsoft.Azure.Documents.Client
open GreyTide.Models.V2
open Newtonsoft.Json.Linq
open Newtonsoft.Json
open GreyTide.data
open GreyTide.Models
open Breeze.ContextProvider
GreyTideDataService.App_Start.AutoMapperConfig.RegisterAutoMapperPreStart()
let databaseId = ConfigurationManager.AppSettings.["DatabaseId"]
let endpointUri = Uri( ConfigurationManager.AppSettings.["ConnectionUri"])
let connectionKey = ConfigurationManager.AppSettings.["ConnectionKey"]
let userToken = Guid(ConfigurationManager.AppSettings.["UserToken"]).ToString("N")
let client = new DocumentClient(endpointUri, connectionKey, ConnectionPolicy(ConnectionProtocol = Protocol.Tcp))
let getDatabase () = 
    let db = 
        client.
            CreateDatabaseQuery().
            Where(fun db -> db.Id = databaseId).
            ToArray().
            FirstOrDefault()
        |> Option.ofObj
    defaultArg db <| client.CreateDatabaseAsync(Database(Id = databaseId)).Result.Resource
let getDocumentCollection (database:Database) =
    let dc = 
        client.
            CreateDocumentCollectionQuery(database.SelfLink).
            Where(fun c -> c.Id = userToken).
            AsEnumerable().
            FirstOrDefault()
        |> Option.ofObj
    defaultArg dc <| client.CreateDocumentCollectionAsync(database.SelfLink, DocumentCollection( Id = userToken )).Result.Resource

let getItems (client:DocumentClient) : IQueryable<'T :> ITypeable> = 
    let database = getDatabase()
    let documentCollection = getDocumentCollection database
    client.
        CreateDocumentQuery<'T>(documentCollection.SelfLink).
        Where(fun sc -> sc.``type`` = typeof<'T>.FullName)

let loadFilesIfTheyDontExist (client:DocumentClient) (items:ResizeArray<'a>) = 
    let database = getDatabase()
    let documentCollection = getDocumentCollection database
    let documentModel = client.
                            CreateDocumentQuery<GreyTide.Models.V2.Model>(documentCollection.SelfLink).
                            Where(fun sc -> sc.``type`` = typeof<'a>.FullName).
                            AsEnumerable().
                            FirstOrDefault() 
    match documentModel with
    | null -> items.ForEach(fun sc -> match client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result with
                                      | result when result.StatusCode <> System.Net.HttpStatusCode.Created || result.StatusCode <> System.Net.HttpStatusCode.OK -> 
                                            Exception("List did not migrate") |> raise 
                                      | _ -> () )
    | _ -> ()

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
        entities.
            Select(fun e -> defaultArg (Option.ofObj e.Document) (JsonConvert.DeserializeObject(e.Document.ToString(), Type.GetType(e.Document.GetPropertyValue<string>("type"))))).
            Where(fun e  -> e <> null).
            Cast<obj>().
            ToList()
    let errors = 
        entities.
            Where(fun result  -> result.StatusCode <> System.Net.HttpStatusCode.Created && result.StatusCode <> System.Net.HttpStatusCode.OK && result.StatusCode <> System.Net.HttpStatusCode.NoContent).
            Select(fun e  -> e.Document).
            Cast<obj>().
            ToList()

    SaveResult(Entities = entitiesList, Errors = (if errors.Count = 0 then null else errors), KeyMappings = keyMappings)
let v1SaveChanges () = v2SaveChanges 
let greyTide client = 
    choose [ GET >=> choose [ path "/" >=> Files.browseFileHome "index.html"
                              path "/tide/v1/Tide" >=> mapJson (GreyTide.Repo.Models.Value.ToList)
                              path "/tide/v1/States" >=> mapJson (GreyTide.Repo.States.Value.ToList)
                              path "/tide/v2/Models" >=> mapJson (v2Models client)
                              path "/tide/v2/States" >=> mapJson (v2States client)
                              Files.browseHome ]
             POST >=> choose [ path "/tide/v1/SaveChanges" >=> 
                               path "/tide/v2/SaveChanges" >=> v2SaveChanges client]
            ]
            
loadFilesIfTheyDontExist client (GreyTide.Repo.States.Value.ToList())
loadFilesIfTheyDontExist client (GreyTide.Repo.Models.Value.ToList())

startWebServer {defaultConfig with homeFolder = Some @"C:\Users\diese\Source\Repos\GreyTide\GreyTide\" } (greyTide client)