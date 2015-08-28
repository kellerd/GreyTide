using System.Collections.Generic;
using System.Linq;
using System.Runtime.Remoting.Messaging;
using System.Web.Http;
using System.Web.OData;
using GreyTideDataService;
using System.Web.OData.Query;
using System.Threading.Tasks;
using GreyTideDataService.Models;
using Microsoft.OData.Core;

namespace Controllers
{
    [EnableQuery]
    public class ModelPartController : ODataController
    {
        public async Task<IHttpActionResult> Get()
        {
            try
            {
                IEnumerable<ModelPart> items = await Repo.Models;
                return Ok(items.AsQueryable());
            }
            catch (ODataException ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}