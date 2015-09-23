using GreyTideDataService.Models.V1;
using System.Data.Entity;
namespace GreyTideDataService
{
    public class GreyTideContext : DbContext
    {
        public DbSet<Model> Tide { get; set; }
        public DbSet<StateCollection> States { get; set; }
    }
}