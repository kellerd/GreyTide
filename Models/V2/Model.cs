using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTideDataService.Models.V2
{
    public class Model : ModelItem
    {
        public Guid UserToken { get; set; }
        [Key]
        public Guid Id { get; set; }
        public string Faction { get; set; }
        public List<ModelItem> Items { get; set; }
    }
}