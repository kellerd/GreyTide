using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTide.Models.V2
{
    public class Model : ModelItem
    {
        [Key]
        public Guid id { get; set; }
        public string faction { get; set; }
        public List<ModelItem> items { get; set; }
        public string type { get { return GetType().FullName; } }
    }
}