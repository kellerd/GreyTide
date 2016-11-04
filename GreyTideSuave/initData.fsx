#I @"..\packages\"
#r @"Microsoft.Azure.DocumentDB\lib\net40\Microsoft.Azure.Documents.Client.dll"
#r "System.Configuration.dll"
#r @"Breeze.Server.ContextProvider\lib\Breeze.ContextProvider.dll"
#r @"..\GreyTide\bin\GreyTide.dll"
#r "System.Web.dll"
open Microsoft.Azure.Documents
open Microsoft.Azure.Documents.Linq
open Microsoft.Azure.Documents.Client
open System.Linq
open System

open System.Configuration
let getSetting (key:string) = ConfigurationManager.AppSettings.[key]
let databaseId = getSetting "DatabaseId"
let endpointUri = Uri( getSetting "ConnectionUri")
let connectionKey = getSetting "ConnectionKey"
let userToken = Guid(getSetting "UserToken").ToString("N")

let client = new DocumentClient(endpointUri, connectionKey, ConnectionPolicy(ConnectionProtocol = Protocol.Tcp))
let getDatabase () = 
    let db = 
        client.CreateDatabaseQuery().
            Where(fun db -> db.Id = databaseId).
            AsEnumerable().
            FirstOrDefault() 
            |> Option.ofObj
    match db with 
    | Some db -> db
    | None -> client.CreateDatabaseAsync(Database(Id = databaseId)).Result.Resource
let getDocumentCollection (database:Database) =
    let dc = 
        client.CreateDocumentCollectionQuery(database.SelfLink).
            Where(fun c -> c.Id = userToken).
            AsEnumerable().
            FirstOrDefault() 
            |> Option.ofObj
    match dc with 
    | Some dc -> dc
    | None -> client.CreateDocumentCollectionAsync(database.SelfLink, DocumentCollection( Id = userToken )).Result.Resource

let loadFilesIfTheyDontExist (client:DocumentClient) (items:ResizeArray<'a>) = 
    let database = getDatabase()
    let documentCollection = getDocumentCollection database
    let documentModel = client.
                            CreateDocumentQuery<GreyTide.Models.V2.Model>(documentCollection.SelfLink).
                            Where(fun sc -> sc.``type`` = typeof<'a>.FullName)
                        |> Seq.tryHead
    match documentModel with
    | None -> items.ForEach(fun sc -> match client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result with
                                      | result when result.StatusCode <> System.Net.HttpStatusCode.Created || result.StatusCode <> System.Net.HttpStatusCode.OK -> 
                                            Exception("List did not migrate") |> raise 
                                      | _ -> () )
    | _ -> ()
               
//loadFilesIfTheyDontExist client (GreyTide.Repo.States.Value.ToList())
//loadFilesIfTheyDontExist client (GreyTide.Repo.Models.Value.ToList())
