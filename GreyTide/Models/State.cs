using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTideDataService.Models
{
    public class State
    {
        // { "order": 0,"name": "Dislike", "from": [ "none", "Completed" ], "to": "Requires Stripping" } 

        public int Order { get; set; }
        [Required]
        [Key]
        public string Name { get; set; }
        [Required]
        public List<string> From { get; set; }
        [Required]
        public string To {get;set;}
    }
}