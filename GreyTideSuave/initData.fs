namespace GreyTideSuave
module InitData =
    open Microsoft.Azure.Documents
    open Microsoft.Azure.Documents.Linq
    open Microsoft.Azure.Documents.Client
    open System.Linq
    open System
    open System.Configuration
    let getSetting (key:string) = ConfigurationManager.AppSettings.[key]

    let client = lazy (
        printfn "Create client"
        let endpointUri = Uri( getSetting "ConnectionUri")
        let connectionKey = getSetting "ConnectionKey"
        new DocumentClient(endpointUri, connectionKey, ConnectionPolicy(ConnectionProtocol = Protocol.Tcp)))
    let getDatabase (client:DocumentClient) () = 
        let databaseId = getSetting "DatabaseId"
        let db = 
            client.CreateDatabaseQuery().
                Where(fun db -> db.Id = databaseId).
                AsEnumerable().
                FirstOrDefault() 
                |> Option.ofObj
        match db with 
        | Some db -> db
        | None -> client.CreateDatabaseAsync(Database(Id = databaseId)).Result.Resource
    let getDocumentCollection (client:DocumentClient) (database:Database) =
        let userToken = Guid(getSetting "UserToken").ToString("N")
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
        let database = getDatabase client ()
        let documentCollection = getDocumentCollection client database
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
               
//    loadFilesIfTheyDontExist client (GreyTide.Repo.States.Value.ToList())
//    loadFilesIfTheyDontExist client (GreyTide.Repo.Models.Value.ToList())
