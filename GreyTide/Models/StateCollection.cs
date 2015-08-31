using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Breeze;
namespace GreyTideDataService.Models
{
    //"name": "Default", "events": []
    public class StateCollection
    {
        public Guid UserToken { get; set; }
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Name { get; set ; }
        public List<State> Events {get;set;} 
    }
}