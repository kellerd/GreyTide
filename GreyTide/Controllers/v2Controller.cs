using System.Linq;
using System.Web.Http;
using GreyTide.Models.V2;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;
using GreyTide.data;
using System;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Linq;
using Microsoft.Azure.Documents.Client;
using GreyTide;
using GreyTide.Controllers;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace Controllers.V2
{
    [BreezeController]
    public class v2Controller : ApiController, IDisposable
    {
        private static readonly DocumentClient Client;

        static v2Controller()
        {
            Uri endpointUri = HardDriveAzureConnectionStr.ConnectionUri;
            Client = new DocumentClient(endpointUri, HardDriveAzureConnectionStr.ConnectionKey);
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
            if (database == null)
                database = Client.CreateDatabaseAsync(new Database
                {
                    Id = HardDriveAzureConnectionStr.DatabaseId
                }).Result;

            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).AsEnumerable().FirstOrDefault();

            if (documentCollection == null)
                documentCollection = Client.CreateDocumentCollectionAsync(database.SelfLink, new DocumentCollection { Id = HardDriveAzureConnectionStr.UserToken.ToString("N") }).Result;
            //Init from .json document if empty
            //Will change to create on account approval/creation
            var documentState = Client.CreateDocumentQuery<StateCollection>(documentCollection.SelfLink).Where(sc => sc.type == typeof(StateCollection).FullName).AsEnumerable().FirstOrDefault();
            if (documentState == null)
                Repo.States.Value.ToList().ForEach(sc =>
                {
                    var result = Client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result;
                    if (result.StatusCode != System.Net.HttpStatusCode.Created && result.StatusCode != System.Net.HttpStatusCode.Accepted)
                        throw new Exception($"{sc.name} is not migrated");
                });

            var documentModel = Client.CreateDocumentQuery<Model>(documentCollection.SelfLink).Where(sc => sc.type == typeof(Model).FullName).AsEnumerable().FirstOrDefault();
            if (documentModel == null)
                Repo.Models.Value.ToList().ForEach(sc =>
                {
                    var result = Client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result;
                    if (result.StatusCode != System.Net.HttpStatusCode.Created && result.StatusCode != System.Net.HttpStatusCode.OK)
                        throw new Exception($"{sc.name} is not migrated");
                });
        }


        // ~/tide/v2/Models
        // ~/tide/v2/Models?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Models()
        {
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).ToArray().FirstOrDefault();
            return Client.CreateDocumentQuery<Model>(documentCollection.SelfLink).Where(sc => sc.type == typeof(Model).FullName);
        }

        // ~/tide/v2/States
        // ~/tide/v2/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<StateCollection> States()
        {
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).ToArray().FirstOrDefault();
            return Client.CreateDocumentQuery<StateCollection>(documentCollection.SelfLink).Where(sc => sc.type == typeof(StateCollection).FullName);
        }

        // ~/tide/v2/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            var entityInfo = SaveBundleToSaveMap.Convert(saveBundle);
            var saveOptions = SaveBundleToSaveMap.ExtractSaveOptions(saveBundle);
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).ToArray().FirstOrDefault();

            //Store in azure
            var entities =  entityInfo.SelectMany(f => f.Value).Select( item =>
            {
                if (item.EntityState == EntityState.Modified || item.EntityState == EntityState.Added)
                {
                    var result =  Client.UpsertDocumentAsync(documentCollection.SelfLink, item.Entity).Result;
                    return new SaveChangesResult { Document = result.Resource, StatusCode = result.StatusCode };
                }
                else if (item.EntityState == EntityState.Deleted)
                {
                    var doc = Client.CreateDocumentQuery(documentCollection.SelfLink).First();
                    var result =  Client.DeleteDocumentAsync(doc.SelfLink).Result;
                    return new SaveChangesResult { Document = null, StatusCode = result.StatusCode };
                }
                else
                {
                    return new SaveChangesResult { Document = null, StatusCode = System.Net.HttpStatusCode.NotImplemented };
                }
            }).ToList();

            // Construct the save result to inform the client that the server has completed the save operation
            var keyMappings = new List<KeyMapping>();
            var entitiesList = entities.Select(e => JsonConvert.DeserializeObject(e.Document.ToString(), Type.GetType(e.Document.GetPropertyValue<string>("type")))).Where(e => e != null).Cast<object>().ToList();
            var errors = entities.Where(result => result.StatusCode != System.Net.HttpStatusCode.Created && result.StatusCode != System.Net.HttpStatusCode.OK).Select(e => e.Document).Cast<object>().ToList();

            return new SaveResult()
            {
                Entities = entitiesList,
                Errors = errors.Count == 0 ? null : errors,
                KeyMappings = keyMappings
            };
        }
    }
}