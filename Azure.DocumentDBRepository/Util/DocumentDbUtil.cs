using Azure.DocumentDBRepository.Partitioning;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Documents.Client.TransientFaultHandling;
using Microsoft.Azure.Documents.Linq;
using Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Azure.DocumentDBRepository.Util
{
    public static class DocumentDbUtil
    {
        /// <summary>
        /// Creates the client.
        /// </summary>
        /// <param name="endpoint">The endpoint.</param>
        /// <param name="authKey">The authentication key.</param>
        /// <returns></returns>
        public static DocumentClient CreateClient(string endpoint, string authKey, ConnectionPolicy connectionPolicy = null)
        {

            Uri endpointUri = new Uri(endpoint);
            var client = new DocumentClient(endpointUri, authKey, connectionPolicy);
            return client;
        }

        /// <summary>
        /// Gets the or create database asynchronous.
        /// </summary>
        /// <param name="Client">The client.</param>
        /// <param name="databaseId">The database identifier.</param>
        /// <returns></returns>
        public static async Task<Database> GetOrCreateDatabaseAsync(DocumentClient Client, string databaseId)
        {
            Database database = Client.CreateDatabaseQuery().Where(db => db.Id == databaseId).ToArray().FirstOrDefault();
            if (database == null)
            {
                database = await Client.CreateDatabaseAsync(new Database { Id = databaseId });
            }

            return database;
        }

        /// <summary>
        /// Gets the or create collection asynchronous.
        /// </summary>
        /// <param name="dbLink">The database link.</param>
        /// <param name="collectionId">The collection identifier.</param>
        /// <returns></returns>
        public static async Task<DocumentCollection> GetOrCreateCollectionAsync(DocumentClient Client, 
            Database db, string collectionId, DocumentCollectionSpec collectionSpec = null)
        {
            DocumentCollection collection = Client.CreateDocumentCollectionQuery(db.SelfLink).Where(c => c.Id == collectionId).ToArray().FirstOrDefault();

            if (collection == null)
            {
                collection = await CreateNewCollection(Client, db, collectionId, collectionSpec);
            }
            return collection;
        }

        /// <summary>
        /// Creates the new collection.
        /// </summary>
        /// <param name="client">The client.</param>
        /// <param name="database">The database.</param>
        /// <param name="collectionId">The collection identifier.</param>
        /// <param name="collectionSpec">The collection spec.</param>
        /// <returns></returns>
        public static async Task<DocumentCollection> CreateNewCollection(
            DocumentClient client,
            Database database,
            string collectionId,
            DocumentCollectionSpec collectionSpec)
        {
            DocumentCollection collectionDefinition = new DocumentCollection { Id = collectionId };
            if (collectionSpec != null)
            {
                CopyIndexingPolicy(collectionSpec, collectionDefinition);
            }

            DocumentCollection collection = await CreateDocumentCollectionWithRetriesAsync(
                client,
                database,
                collectionDefinition,
                (collectionSpec != null) ? collectionSpec.OfferType : null);

            if (collectionSpec != null)
            {
                await RegisterScripts(client, collectionSpec, collection);
            }

            return collection;
        }

        /// <summary>
        /// Registers the stored procedures, triggers and UDFs in the collection spec/template.
        /// </summary>
        /// <param name="client">The DocumentDB client.</param>
        /// <param name="collectionSpec">The collection spec/template.</param>
        /// <param name="collection">The collection.</param>
        /// <returns>The Task object for asynchronous execution.</returns>
        public static async Task RegisterScripts(DocumentClient client, DocumentCollectionSpec collectionSpec, DocumentCollection collection)
        {
            if (collectionSpec.StoredProcedures != null)
            {
                foreach (StoredProcedure sproc in collectionSpec.StoredProcedures)
                {
                    await client.CreateStoredProcedureAsync(collection.SelfLink, sproc);
                }
            }

            if (collectionSpec.Triggers != null)
            {
                foreach (Trigger trigger in collectionSpec.Triggers)
                {
                    await client.CreateTriggerAsync(collection.SelfLink, trigger);
                }
            }

            if (collectionSpec.UserDefinedFunctions != null)
            {
                foreach (UserDefinedFunction udf in collectionSpec.UserDefinedFunctions)
                {
                    await client.CreateUserDefinedFunctionAsync(collection.SelfLink, udf);
                }
            }
        }

        /// <summary>
        /// Copies the indexing policy from the collection spec.
        /// </summary>
        /// <param name="collectionSpec">The collection spec/template</param>
        /// <param name="collectionDefinition">The collection definition to create.</param>
        public static void CopyIndexingPolicy(DocumentCollectionSpec collectionSpec, DocumentCollection collectionDefinition)
        {
            if (collectionSpec.IndexingPolicy != null)
            {
                collectionDefinition.IndexingPolicy.Automatic = collectionSpec.IndexingPolicy.Automatic;
                collectionDefinition.IndexingPolicy.IndexingMode = collectionSpec.IndexingPolicy.IndexingMode;

                if (collectionSpec.IndexingPolicy.IncludedPaths != null)
                {
                    foreach (IncludedPath path in collectionSpec.IndexingPolicy.IncludedPaths)
                    {
                        collectionDefinition.IndexingPolicy.IncludedPaths.Add(path);
                    }
                }

                if (collectionSpec.IndexingPolicy.ExcludedPaths != null)
                {
                    foreach (ExcludedPath path in collectionSpec.IndexingPolicy.ExcludedPaths)
                    {
                        collectionDefinition.IndexingPolicy.ExcludedPaths.Add(path);
                    }
                }
            }
        }

        /// <summary>
        /// Create a DocumentCollection, and retry when throttled.
        /// </summary>
        /// <param name="client">The DocumentDB client instance.</param>
        /// <param name="database">The database to use.</param>
        /// <param name="collectionDefinition">The collection definition to use.</param>
        /// <param name="offerType">The offer type for the collection.</param>
        /// <returns>The created DocumentCollection.</returns>
        public static async Task<DocumentCollection> CreateDocumentCollectionWithRetriesAsync(
            DocumentClient client,
            Database database,
            DocumentCollection collectionDefinition,
            string offerType = "S1")
        {
            return await client.CreateDocumentCollectionAsync(
                        database.SelfLink,
                        collectionDefinition,
                        new RequestOptions
                        {
                            OfferType = offerType
                        });
        }

        

        public static async Task<IEnumerable<DocumentCollection>> GetOrCreatePartitionCollections(DocumentClient Client, Database db, string collectionPrefix, int partitionCount)
        {
            var collections = new List<DocumentCollection>();

            //autoscaling in that case
            //if (_partitionCount == 0)
            //{
            //    var existingCollections = Client.CreateDocumentCollectionQuery(Database.SelfLink)
            //        .Where(x => x.Id.StartsWith(_collectionPrefix));
            //    int existingCount = existingCollections.Count();

            //    for (int i = 0; i < existingCount; i++)
            //    {
            //        var feedResponse = await Client.ReadDocumentCollectionAsync(_collectionPrefix + i);
            //        //TODO Auto-size checking
            //    }
            //}

            for (int i = 0; i < partitionCount; i++)
            {
                var col = await DocumentDbUtil.GetOrCreateCollectionAsync(Client, db, collectionPrefix + i);
                collections.Add(col);
            }

            return collections;
        }
    }
}
