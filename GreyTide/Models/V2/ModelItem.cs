using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTide.Models.V2
{
    public class ModelItem
    {
        [Required]
        public string name { get; set; }
        [Required]
        public string currentState { get; set; }
        public DateTime currentDate { get; set; }
        public int points { get; set; }
        public List<ModelState> states { get; set; }
    }
}