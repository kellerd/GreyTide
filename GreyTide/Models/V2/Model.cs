using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTide.Models.V2
{
    public class Model : ModelItem
    {
        [Key]
        public Guid Id { get; set; }
        public string Faction { get; set; }
        public List<ModelItem> Items { get; set; }
        public string Type { get { return GetType().FullName; } }
    }
}