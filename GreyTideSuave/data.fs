namespace GreyTideSuave
module Data =
    open Breeze.ContextProvider
    open Microsoft.Azure.Documents.Linq
    open Microsoft.Azure.Documents.Client
    open GreyTide.Models.V2
    open System.Linq
    open GreyTide.Models
    open GreyTide.data
    open AutoMapper
    open System.Collections.Generic
    open Newtonsoft.Json.Linq
    open Newtonsoft.Json
    open InitData
    open Microsoft.Azure.Documents
    open Microsoft.Azure.Documents.Linq
    open Microsoft.Azure.Documents.Client
    open System.Linq
    open System

    GreyTideDataService.App_Start.AutoMapperConfig.RegisterAutoMapperPreStart()

    let getItems (client:DocumentClient) : IQueryable<'T :> ITypeable> = 
        let database = getDatabase client ()
        let documentCollection = getDocumentCollection client database
        client.CreateDocumentQuery<'T>(documentCollection.SelfLink).
            Where(fun sc -> sc.``type`` = typeof<'T>.FullName)

    let v1Models = AutoMapper.Mapper.Map<IEnumerable<V1.Model>>(GreyTide.Repo.Models.Value).AsQueryable()
    let v1States = Mapper.Map<IEnumerable<V1.StateCollection>>(GreyTide.Repo.States.Value).AsQueryable()
    let v2Models client : IQueryable<GreyTide.Models.V2.Model> = getItems client
    let v2States client : IQueryable<GreyTide.Models.V2.StateCollection> =  getItems client

    let v2SaveChanges (client:DocumentClient) (saveBundle:JObject) = 
        let entityInfo = SaveBundleToSaveMap.Convert(saveBundle);
        let database = getDatabase client ()
        let documentCollection = getDocumentCollection client database

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
                                            client.CreateDocumentQuery(documentCollection.SelfLink).
                                                Where(fun sc -> sc.Id = entity.id.ToString()).
                                                AsEnumerable().
                                                FirstOrDefault() 
                                            |> Option.ofObj
                                            |> Option.map (fun doc -> let result = client.DeleteDocumentAsync(doc.SelfLink).Result
                                                                      SaveChangesResult ( Document = null, StatusCode = result.StatusCode ))
                                        defaultArg result (SaveChangesResult ( Document = null, StatusCode = System.Net.HttpStatusCode.NoContent ))
                                    | _,_ -> 
                                        SaveChangesResult ( Document = null, StatusCode = System.Net.HttpStatusCode.NotImplemented ))

        let keyMappings = ResizeArray<KeyMapping>();
        let entitiesList = 
            entities
            |> Seq.map(fun e -> defaultArg (Option.ofObj (e.Document :> obj)) (JsonConvert.DeserializeObject(e.Document.ToString(), System.Type.GetType(e.Document.GetPropertyValue<string>("type")))))
            |> Seq.filter(isNull >> not)
            |> ResizeArray
        let errors = 
            entities
            |> Seq.filter(fun result  -> result.StatusCode <> System.Net.HttpStatusCode.Created && result.StatusCode <> System.Net.HttpStatusCode.OK && result.StatusCode <> System.Net.HttpStatusCode.NoContent)
            |> Seq.map (fun e  -> e.Document :> obj)
            |> ResizeArray
        SaveResult(Entities = entitiesList, Errors = (if errors.Count = 0 then null else errors), KeyMappings = keyMappings)

    let v1SaveChanges = v2SaveChanges 