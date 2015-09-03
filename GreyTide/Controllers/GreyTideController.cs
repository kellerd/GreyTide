using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using GreyTideDataService;
using System.Threading.Tasks;
using GreyTideDataService.Models;
using Breeze.WebApi2;
using Breeze.ContextProvider;
using Newtonsoft.Json.Linq;

namespace Controllers
{
    [BreezeController]
    public class GreyTideController : ApiController
    {

        static readonly Repo _contextProvider = new Repo();

        // ~/breeze/GreyTide/Metadata 
        [HttpGet]
        public string Metadata()
        {
            var metadata =  _contextProvider.Metadata();
            return metadata;
        }

        // ~/breeze/GreyTide/Models
        // ~/breeze/GreyTide/Models?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public IQueryable<Model> Models()
        {
            return Repo.Models.Value.AsQueryable();
        }

        // ~/breeze/GreyTide/States
        // ~/breeze/GreyTide/States?$filter=IsArchived eq false&$orderby=CreatedAt 
        [HttpGet]
        public  IQueryable<StateCollection> States()
        {
            return Repo.States.Value.AsQueryable();
        }

        // ~/breeze/GreyTide/SaveChanges
        [HttpPost]
        public SaveResult SaveChanges(JObject saveBundle)
        {
            return _contextProvider.SaveChanges(saveBundle);
        }

    }
}