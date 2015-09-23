using System.Linq;
using System.Web.Http;
using GreyTideDataService;
using GreyTideDataService.Models.V1;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;

namespace Controllers.V1
{
    [BreezeController]
    public class v1Controller : ApiController
    {

        static readonly Repo _contextProvider = new Repo();

        // ~/tide/v1/Metadata 
        [HttpGet]
        public string Metadata()
        {
            var metadata = _contextProvider.Metadata();
            return metadata;
        }

        // ~/tide/v1/Tide
        // ~/tide/v1/Tide?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Tide()
        {
            return Repo.Tide.Value.AsQueryable();
        }

        // ~/tide/v1/States
        // ~/tide/v1/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<StateCollection> States()
        {
            return Repo.States.Value.AsQueryable();
        }

        // ~/tide/v1/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }

    }
}