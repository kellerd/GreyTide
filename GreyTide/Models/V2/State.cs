using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTide.Models.V2
{
    public class State
    {
        // { "order": 0,"name": "Dislike", "from": [ "none", "Completed" ], "to": "Requires Stripping" } 

        public int order { get; set; }
        [Required]
        public string name { get; set; }
        [Required]
        public List<string> from { get; set; }
        [Required]
        public string to {get;set;}
    }
}