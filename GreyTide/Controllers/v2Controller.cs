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
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Configuration;
using GreyTide.Models;

namespace Controllers.V2
{
    [BreezeController]
    public class v2Controller : ApiController, IDisposable
    {
        private static readonly DocumentClient Client;

        static v2Controller()
        {
            Uri endpointUri =new Uri( ConfigurationManager.AppSettings["ConnectionUri"]);
            string connectionKey = ConfigurationManager.AppSettings["ConnectionKey"];
            string databaseId = ConfigurationManager.AppSettings["DatabaseId"];
            string userToken = new Guid(ConfigurationManager.AppSettings["UserToken"]).ToString("N");

            Client = new DocumentClient(endpointUri, connectionKey, new ConnectionPolicy() { ConnectionProtocol = Protocol.Tcp });
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == databaseId).ToArray().FirstOrDefault();
            if (database == null)
                database = Client.CreateDatabaseAsync(new Database { Id = databaseId }).Result;
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == userToken).AsEnumerable().FirstOrDefault();
            if (documentCollection == null)
                documentCollection = Client.CreateDocumentCollectionAsync(database.SelfLink, new DocumentCollection { Id = userToken }).Result;

            LoadFromFilesIfTheyDontExist<StateCollection>(documentCollection, Repo.States.Value.ToList());
            LoadFromFilesIfTheyDontExist<Model>(documentCollection, Repo.Models.Value.ToList());
        }
        public v2Controller() { }
        private static void LoadFromFilesIfTheyDontExist<T>(DocumentCollection documentCollection, List<T> listOfValuesIfMissing)
        {
            var documentModel = Client.CreateDocumentQuery<Model>(documentCollection.SelfLink).Where(sc => sc.type == typeof(T).FullName).AsEnumerable().FirstOrDefault();
            if (documentModel == null)
                listOfValuesIfMissing.ForEach(sc =>
                {
                    var result = Client.UpsertDocumentAsync(documentCollection.SelfLink, sc).Result;
                    if (result.StatusCode != System.Net.HttpStatusCode.Created && result.StatusCode != System.Net.HttpStatusCode.OK)
                        throw new Exception($"List did not migrate");
                });
        }


        // ~/tide/v2/Models
        // ~/tide/v2/Models?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Models()
        {
            return GetItems<Model>();
        }

        public static IQueryable<T> GetItems<T>() where T : ITypeable
        {
            string databaseId = ConfigurationManager.AppSettings["DatabaseId"];
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == databaseId).ToArray().FirstOrDefault();
            string userToken = new Guid(ConfigurationManager.AppSettings["UserToken"]).ToString("N");
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == userToken).ToArray().FirstOrDefault();
            return Client.CreateDocumentQuery<T>(documentCollection.SelfLink).Where(sc => sc.type == typeof(T).FullName);
        }

        // ~/tide/v2/States
        // ~/tide/v2/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<StateCollection> States()
        {
            return GetItems<StateCollection>();
        }

        // ~/tide/v2/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            var entityInfo = SaveBundleToSaveMap.Convert(saveBundle);
            //var saveOptions = SaveBundleToSaveMap.ExtractSaveOptions(saveBundle);
            string databaseId = ConfigurationManager.AppSettings["DatabaseId"];
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == databaseId).ToArray().FirstOrDefault();
            string userToken = new Guid(ConfigurationManager.AppSettings["UserToken"]).ToString("N");
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == userToken).ToArray().FirstOrDefault();

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
                    var doc = Client.CreateDocumentQuery(documentCollection.SelfLink).Where(sc=> sc.Id == ((IIdentifyable)(item.Entity)).id.ToString()).ToArray().FirstOrDefault();
                    if (doc != null) {
                        var result = Client.DeleteDocumentAsync(doc.SelfLink).Result;
                        return new SaveChangesResult { Document = null, StatusCode = result.StatusCode };
                    }  else {
                        return new SaveChangesResult { Document = null, StatusCode = System.Net.HttpStatusCode.NoContent };
                    }
                }
                else
                {
                    return new SaveChangesResult { Document = null, StatusCode = System.Net.HttpStatusCode.NotImplemented };
                }
            }).ToList();

            // Construct the save result to inform the client that the server has completed the save operation
            var keyMappings = new List<KeyMapping>();
            var entitiesList = entities.Select(e => e.Document == null ? e.Document : JsonConvert.DeserializeObject(e.Document.ToString(), Type.GetType(e.Document.GetPropertyValue<string>("type")))).Where(e => e != null).Cast<object>().ToList();
            var errors = entities.Where(result => result.StatusCode != System.Net.HttpStatusCode.Created && result.StatusCode != System.Net.HttpStatusCode.OK && result.StatusCode != System.Net.HttpStatusCode.NoContent).Select(e => e.Document).Cast<object>().ToList();

            return new SaveResult()
            {
                Entities = entitiesList,
                Errors = errors.Count == 0 ? null : errors,
                KeyMappings = keyMappings
            };
        }
    }
}