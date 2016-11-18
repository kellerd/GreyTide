namespace GreyTide
module Data =
    open Breeze.ContextProvider
    open Microsoft.Azure.Documents.Linq
    open Microsoft.Azure.Documents.Client
    open GreyTide.Models
    open Newtonsoft.Json.Linq
    open Newtonsoft.Json
    open InitData
    open Microsoft.Azure.Documents
    open Microsoft.Azure.Documents.Linq
    open Microsoft.Azure.Documents.Client
    open System.Linq
    open Repo
    open System.Net
    open MapperConfiguration

    type SaveChangesResult = { Document:Document option; StatusCode : HttpStatusCode}
    let repo = Repo()
    

    let getItems (client:DocumentClient)  : IOrderedQueryable<'a>  = 
        let database = getDatabase client ()
        let documentCollection = getDocumentCollection client database
        client.CreateDocumentQuery<'a>(documentCollection.SelfLink)

    let v1Models = (Seq.map mapModels repo.Models.Value).AsQueryable()
    let v1States = (Seq.map mapStateCollection repo.States.Value).AsQueryable()
    let v2Models client : IQueryable<V2.Model> = (getItems client).Where(fun (sc:V2.Model) -> sc.``type`` = typeof<V2.Model>.FullName)
    let v2States client : IQueryable<V2.StateCollection> = (getItems client).Where(fun (sc:V2.StateCollection) -> sc.``type`` = typeof<V2.StateCollection>.FullName)

    let v2SaveChanges (client:DocumentClient) (saveBundle:JObject) = 
        let entityInfo = Repo.Convert(saveBundle, null, null);
        let database = getDatabase client ()
        let documentCollection = getDocumentCollection client database

        let delectDoc (client:DocumentClient) (docOption:Document option) = 
            let result = 
                docOption
                |> Option.map (fun doc -> let result = client.DeleteDocumentAsync(doc.SelfLink).Result
                                          { Document = None; StatusCode = result.StatusCode })
            defaultArg result { Document = None; StatusCode = HttpStatusCode.NoContent }

        //Store in azure
        let entities = 
            entityInfo 
            |> Seq.collect (fun f -> f.Value)
            |> Seq.map (fun item -> match (item.EntityState, item.Entity) with
                                    | (state, entity) when state = EntityState.Modified || state = EntityState.Added -> 
                                        let result = client.UpsertDocumentAsync(documentCollection.SelfLink, entity).Result
                                        {Document = result.Resource |> Option.ofObj; StatusCode = result.StatusCode}
                                    | state, (:? V2.Model as entity) when state = EntityState.Deleted ->
                                        client.CreateDocumentQuery(documentCollection.SelfLink).
                                                Where(fun sc -> sc.Id = entity.id.ToString()).
                                                AsEnumerable().
                                                FirstOrDefault() 
                                        |> Option.ofObj
                                        |> delectDoc client
                                    | state, (:? V2.StateCollection as entity) when state = EntityState.Deleted ->
                                        client.CreateDocumentQuery(documentCollection.SelfLink).
                                                Where(fun sc -> sc.Id = entity.id.ToString()).
                                                AsEnumerable().
                                                FirstOrDefault() 
                                        |> Option.ofObj
                                        |> delectDoc client
                                    | _,_ -> 
                                        { Document = None; StatusCode = HttpStatusCode.NotImplemented }
                )
        let keyMappings = ResizeArray<KeyMapping>();
        let entitiesList = 
            entities
            |> Seq.choose(fun {Document = doc} -> Option.map (fun (doc:Document) -> 
                JsonConvert.DeserializeObject(doc.ToString(), System.Type.GetType(doc.GetPropertyValue<string>("type")))) doc)
            |> ResizeArray
        let errors = 
            entities
            |> Seq.filter(fun {StatusCode = statusCode}  -> statusCode <> System.Net.HttpStatusCode.Created && statusCode <> System.Net.HttpStatusCode.OK && statusCode <> System.Net.HttpStatusCode.NoContent)
            |> Seq.map (fun e  -> e.Document :> obj)
            |> ResizeArray
        SaveResult(Entities = entitiesList, Errors = (if errors.Count = 0 then null else errors), KeyMappings = keyMappings)

    let v1SaveChanges = v2SaveChanges 