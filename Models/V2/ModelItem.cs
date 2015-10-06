using Microsoft.Azure.Documents;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTideDataService.Models.V2
{
    public class ModelItem : Document
    {
        [Required]
        public string Name { get; set; }
        [Required]
        public string CurrentState { get; set; }
        public DateTime CurrentDate { get; set; }
        public int Points { get; set; }
        public List<ModelState> States { get; set; }
    }
}