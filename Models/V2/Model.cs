using System;
using System.Collections.Generic;

namespace GreyTideDataService.Models.V2
{
    public class Model : ModelItem
    {
        public string Faction { get; set; }
        public List<ModelItem> Items { get; set; }
    }
}