﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTideDataService.Models.V2
{
    public class State
    {
        // { "order": 0,"name": "Dislike", "from": [ "none", "Completed" ], "to": "Requires Stripping" } 

        public int Order { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public List<FromState> From { get; set; }
        [Required]
        public string To {get;set;}
    }
}