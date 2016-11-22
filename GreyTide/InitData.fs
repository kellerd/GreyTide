namespace GreyTide

module InitData = 
    open Microsoft.Azure.Documents
    open Microsoft.Azure.Documents.Linq
    open Microsoft.Azure.Documents.Client
    open System.Linq
    open System
    open System.Configuration
    
    let getSetting (key : string) = ConfigurationManager.AppSettings.[key]
    
    let client = 
        lazy (printfn "Create client"
              let endpointUri = Uri(getSetting "ConnectionUri")
              let connectionKey = getSetting "ConnectionKey"
              new DocumentClient(endpointUri, connectionKey, ConnectionPolicy(ConnectionProtocol = Protocol.Tcp)))
    
    let getDatabase (client : DocumentClient) () = 
        let databaseId = getSetting "DatabaseId"
        let db = 
            client.CreateDatabaseQuery().Where(fun db -> db.Id = databaseId).AsEnumerable().FirstOrDefault() 
            |> Option.ofObj
        match db with
        | Some db -> db
        | None -> client.CreateDatabaseAsync(Database(Id = databaseId)).Result.Resource
    
    let getDocumentCollection (client : DocumentClient) (database : Database) = 
        let documentCollectionId = Guid(getSetting "DocumentCollectionId").ToString("N")
        let dc = 
            client.CreateDocumentCollectionQuery(database.SelfLink).Where(fun c -> c.Id = documentCollectionId).AsEnumerable()
                  .FirstOrDefault() |> Option.ofObj
        match dc with
        | Some dc -> dc
        | None -> 
            client.CreateDocumentCollectionAsync(database.SelfLink, DocumentCollection(Id = documentCollectionId)).Result.Resource
    
    let loadFilesIfTheyDontExist (client : DocumentClient) (items : ResizeArray<'a>) (hasSome : IQueryable<'a> -> bool)= 
        let database = getDatabase client ()
        let documentCollection = getDocumentCollection client database
        if hasSome (client.CreateDocumentQuery<'a>(documentCollection.SelfLink)) then ()
        else
            items.ForEach(fun sc -> 
                match client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result with
                | result when result.StatusCode <> System.Net.HttpStatusCode.Created 
                              || result.StatusCode <> System.Net.HttpStatusCode.OK -> 
                    Exception("List did not migrate") |> raise
                | _ -> ())
