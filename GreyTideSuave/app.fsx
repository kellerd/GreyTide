// Learn more about F# at http://fsharp.net
// See the 'F# Tutorial' project for more help.
#I @"..\packages\"
#r @"Suave\lib\net40\Suave.dll"
#r "System.Configuration.dll"
#r @"Microsoft.Azure.DocumentDB\lib\net40\Microsoft.Azure.Documents.Client.dll"
#r @"C:\Users\diese\Source\Repos\GreyTide\GreyTide\bin\GreyTide.dll"
open Suave
open Suave.Filters
open Suave.Operators
open System.Linq
open System
open System.Configuration

open Microsoft.Azure.Documents
open Microsoft.Azure.Documents.Linq
open Microsoft.Azure.Documents.Client

let loadFilesIfTheyDontExist (client:DocumentClient) (documentCollection:DocumentCollection) (items:ResizeArray<'a>) = 
    let documentModel = client.CreateDocumentQuery<GreyTide.Models.V2.Model>(documentCollection.SelfLink).Where(fun sc -> sc.``type`` = typeof<'a>.FullName).AsEnumerable().FirstOrDefault() |> Option.ofObj
    match documentModel with
    | None -> items.ForEach(fun sc -> match client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result with
                                      | result when result.StatusCode <> System.Net.HttpStatusCode.Created || result.StatusCode <> System.Net.HttpStatusCode.OK -> 
                                            Exception("List did not migrate") |> raise 
                                      | _ -> ()
                                )
    | Some(_) -> ()

let greyTide = 
    let endpointUri = Uri( ConfigurationManager.AppSettings.["ConnectionUri"])
    let connectionKey = ConfigurationManager.AppSettings.["ConnectionKey"]
    let databaseId = ConfigurationManager.AppSettings.["DatabaseId"]
    let userToken = Guid(ConfigurationManager.AppSettings.["UserToken"]).ToString("N")
    use client = new DocumentClient(endpointUri, connectionKey, ConnectionPolicy(ConnectionProtocol = Protocol.Tcp))
    let database = defaultArg (Option.ofObj (client.CreateDatabaseQuery().Where(fun db -> db.Id = databaseId).ToArray().FirstOrDefault())) (client.CreateDatabaseAsync(new Database(Id = databaseId)).Result.Resource)
    let documentCollection : DocumentCollection = defaultArg (Option.ofObj (client.CreateDocumentCollectionQuery(database.SelfLink).Where(fun c -> c.Id = userToken).AsEnumerable().FirstOrDefault())) (client.CreateDocumentCollectionAsync(database.SelfLink, new DocumentCollection( Id = userToken )).Result.Resource)
    loadFilesIfTheyDontExist client documentCollection (GreyTide.Repo.States.Value.ToList())
//            LoadFromFilesIfTheyDontExist<StateCollection>(documentCollection, Repo.States.Value.ToList())
//            LoadFromFilesIfTheyDontExist<Model>(documentCollection, Repo.Models.Value.ToList())
  choose
    [ GET >=> choose
        [ path "/" >=> Files.browseFileHome "index.html"
          path "/tide/v1/Tide" >=>
          path "/tide/v1/States" >=>
          path "/tide/v2/Models" >=>
          path "/tide/v2/States" >=>
          //path "/tide/v2/Models" >=> ToJson (getModels)
          Files.browseHome]
      POST >=> choose
        [ path "/tide/v1/SaveChanges" >=>
          path "/tide/v2/SaveChanges" >=> ]
     ]
            
startWebServer {defaultConfig with homeFolder = Some @"C:\Users\diese\Source\Repos\GreyTide\GreyTide\" } greyTide