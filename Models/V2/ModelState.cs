using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTideDataService.Models.V2
{
   public class ModelState
   {
       [Required]
       public string Name { get; set; }
       [Required]
       public DateTime Date { get; set; }
    }
}
