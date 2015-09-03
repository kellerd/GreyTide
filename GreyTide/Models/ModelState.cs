using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTideDataService.Models
{
   public class ModelState
   {
        [Key]
       [Required]
       public string Name { get; set; }
       [Required]
       public DateTime Date { get; set; }
        [ForeignKey("Model")]
        public Guid ModelId { get { return (Model == null ? Guid.Empty : Model.Id); } set { return; } }
        public Model Model { get; set; }
    }
}
