using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTideDataService.Models
{
    public class Model
    {
        public Guid UserToken { get; set; }
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Current { get; set; }
        public DateTime CurrentDate { get; set; }
        public string Faction { get; set; }
        public int Points { get; set; }
        public List<Model> Items { get; set; }
        public List<ModelState>  States{ get; set; }
    }
}