using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTide.Models.V2
{
   public class ModelState
   {
       [Required]
       public string name { get; set; }
       [Required]
       public DateTime date { get; set; }
    }
}
