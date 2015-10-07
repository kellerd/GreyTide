using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace GreyTideDataService.Models.V2
{
    public class Model : ModelItem
    {
        [JsonProperty(PropertyName = "id")]
        public Guid Id { get; set; }
        public string Faction { get; set; }
        public List<ModelItem> Items { get; set; }
        public string Type { get { return GetType().FullName; } }
    }
}