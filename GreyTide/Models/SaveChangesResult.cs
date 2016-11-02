using System.Net;
using Microsoft.Azure.Documents;

namespace GreyTide.Models
{
    public class SaveChangesResult 
    {
        public Document Document { get; set; }
        public HttpStatusCode StatusCode { get; set; }
    }
}