using System.Linq;
using System.Web.Http;
using GreyTideDataService;
using GreyTideDataService.Models.V2;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;

namespace Controllers.V2
{
    [BreezeController]
    public class v2Controller : ApiController
    {

        static readonly Repo _contextProvider = new Repo();


        // ~/tide/v2/Models
        // ~/tide/v2/Models?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Models()
        {
            return Repo.Tide.Value.AsQueryable();
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
            return _contextProvider.SaveChanges(saveBundle);
        }

    }
}