using Microsoft.Azure.Documents;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace GreyTideDataService.Models.V2
{
    //"name": "Default", "events": []
    public class StateCollection : Document
    {
        [Required]
        public string Name { get; set ; }
        public List<State> Events {get;set;} 
    }
}