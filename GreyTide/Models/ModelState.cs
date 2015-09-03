using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace GreyTideDataService.Models
{
   public class ModelState
   {
       [Required][Key]
       public string Name { get; set; }
       [Required]
       public DateTime Date { get; set; }
    }
}
