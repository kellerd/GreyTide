using System.Linq;
using System.Web.Http;
using GreyTideDataService;
using GreyTideDataService.Models.V1;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;
using AutoMapper;
using System.Collections.Generic;
using System.Data.Entity;
using Breeze.ContextProvider.EF6;

namespace Controllers.V1
{
    [BreezeController]
    public class v1Controller : ApiController
    {
        static v1Controller()
        {
            Database.SetInitializer<GreyTideContext>(null);
        }
        static readonly Repo _contextProvider = new Repo();
        static EFContextProvider<GreyTideContext> MetadataConects =
             new EFContextProvider<GreyTideContext>();
        // ~/tide/v1/Metadata 
        [HttpGet]
        public string Metadata()
        {
            return MetadataConects.Metadata();
        }

        // ~/tide/v1/Tide
        // ~/tide/v1/Tide?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Tide()
        {
            return Mapper.Map<IEnumerable<Model>>(Repo.Tide.Value).AsQueryable();
        }

        // ~/tide/v1/States
        // ~/tide/v1/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<StateCollection> States()
        {
            return Mapper.Map<IEnumerable<StateCollection>>(Repo.States.Value).AsQueryable();
        }

        // ~/tide/v1/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return new V2.v2Controller().SaveChanges(saveBundle);
        }

    }
}