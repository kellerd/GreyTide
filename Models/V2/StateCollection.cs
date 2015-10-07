using Microsoft.Azure.Documents;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace GreyTideDataService.Models.V2
{
    //"name": "Default", "events": []
    public class StateCollection
    {
        [JsonProperty(PropertyName = "id")]
        public Guid Id { get; set; }
        [Required]
        public string Name { get; set ; }
        public List<State> Events {get;set;}
        public string Type { get { return GetType().FullName; } }
    }
}