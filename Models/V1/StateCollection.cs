using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace GreyTideDataService.Models.V1
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