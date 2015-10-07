using System.Linq;
using System.Web.Http;
using GreyTideDataService;
using GreyTideDataService.Models.V2;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;
using GreyTide.data;
using System;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Linq;
using Microsoft.Azure.Documents.Client;

namespace Controllers.V2
{
    [BreezeController]
    public class v2Controller : ApiController, IDisposable
    {
        private static readonly DocumentClient Client;

        static v2Controller()
        {

            try
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
                var documentState = Client.CreateDocumentQuery<StateCollection>(documentCollection.SelfLink).Where(sc => sc.Type == typeof(StateCollection).FullName).AsEnumerable().FirstOrDefault();
                if (documentState == null)
                    Repo.States.Value.ToList().ForEach(sc => Client.CreateDocumentAsync(documentCollection.SelfLink, sc));

                var documentModel = Client.CreateDocumentQuery<Model>(documentCollection.SelfLink).Where(sc => sc.Type == typeof(Model).FullName).AsEnumerable().FirstOrDefault();
                if (documentModel == null)
                    Repo.Models.Value.ToList().ForEach(sc => Client.CreateDocumentAsync(documentCollection.SelfLink, sc));
            }
            catch (Exception ex)
            {

                throw;
            }

        }


        // ~/tide/v2/Models
        // ~/tide/v2/Models?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Models()
        {
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).AsEnumerable().FirstOrDefault();
            return Client.CreateDocumentQuery<Model>(documentCollection.SelfLink).Where(sc => sc.Type == typeof(Model).FullName);
        }

        // ~/tide/v2/States
        // ~/tide/v2/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<StateCollection> States()
        {
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
            DocumentCollection documentCollection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).AsEnumerable().FirstOrDefault();
            string typeName = typeof(StateCollection).FullName;
            return Client.CreateDocumentQuery<StateCollection>(documentCollection.SelfLink).Where(sc => sc.Type == typeof(StateCollection).FullName);
        }

        // ~/tide/v2/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            //Store in azure
            return new SaveResult();
        }
    }
}