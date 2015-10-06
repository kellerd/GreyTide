using System.Linq;
using System.Web.Http;
using GreyTideDataService;
using GreyTideDataService.Models.V2;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;
using GreyTide.data;
using Microsoft.Azure.Documents.Client.TransientFaultHandling;
using System;
using Azure.DocumentDBRepository.Util;
using Microsoft.Azure.Documents;
using Azure.DocumentDBRepository;
using System.Collections.Generic;
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
                Client = new Microsoft.Azure.Documents.Client.DocumentClient(endpointUri, HardDriveAzureConnectionStr.ConnectionKey);
                Database database = Client.CreateDatabaseQuery().Where(db => db.Id == HardDriveAzureConnectionStr.DatabaseId).ToArray().FirstOrDefault();
                if (database == null)
                {
                    database = Client.CreateDatabaseAsync(new Database { Id = HardDriveAzureConnectionStr.DatabaseId }).Result;
                }

                DocumentCollection collectionDefinition = new DocumentCollection { Id = HardDriveAzureConnectionStr.UserToken.ToString("N") };
                DocumentCollection collection = Client.CreateDocumentCollectionQuery(database.SelfLink).Where(c => c.Id == HardDriveAzureConnectionStr.UserToken.ToString("N")).ToArray().FirstOrDefault();

                if (collection == null)
                {
                    collection = Client.CreateDocumentCollectionAsync(
                            database.SelfLink,
                            collectionDefinition,
                            new Microsoft.Azure.Documents.Client.RequestOptions
                            {
                                OfferType = "S1"
                            }).Result;
                }

                //Init from .json document if empty
                //Will change to create on account approval/creation


                SqlQuerySpec stateQuery = new SqlQuerySpec("SELECT * From StateCollection");
                var stateResults = Client.CreateDocumentQuery<StateCollection>(database.SelfLink).Count();
                if (stateResults == 0)
                {
                    Repo.States.Value.ToList().ForEach(async sc =>
                    {
                        await Client.CreateDocumentAsync(database.SelfLink, sc, null, false);
                    });
                }
                SqlQuerySpec modelQuery = new SqlQuerySpec("SELECT * From Model");
                var modelResults = Client.CreateDocumentQuery<Model>(database.SelfLink).Count();
                if (modelResults == 0)
                {
                    Repo.Models.Value.ToList().ForEach(async sc =>
                    {
                        await Client.CreateDocumentAsync(database.SelfLink, sc, null, false);
                    });
                }

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
            return Repo.Models.Value.AsQueryable();
        }

        // ~/tide/v2/States
        // ~/tide/v2/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<StateCollection> States()
        {
            return Repo.States.Value.AsQueryable();
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