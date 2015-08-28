using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Results;
using System.Web.OData;
using GreyTideDataService;
using GreyTideDataService.Models;
using Microsoft.OData.Core;

namespace Controllers
{
    [EnableQuery]
    public class StatesController : ODataController
    {
        public async Task<IHttpActionResult> Get()
        {
            try
            {
                IEnumerable<StateCollection> items = await Repo.States;
                return Ok(items.AsQueryable());
            }
            catch (ODataException ex)
            {
                return  InternalServerError(ex);
            }
        }
    }
}