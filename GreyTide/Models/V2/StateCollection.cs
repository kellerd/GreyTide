using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace GreyTide.Models.V2
{
    //"name": "Default", "events": []
    public class StateCollection : IIdentifyable, ITypeable
    {
        [Key]
        public Guid id { get; set; }
        [Required]
        public string name { get; set ; }
        public List<State> events {get;set;}
        public string type { get { return GetType().FullName; } }
    }
}