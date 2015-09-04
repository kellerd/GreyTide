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
        public Guid ModelId { get { return (Model == null ? Guid.Empty : Model.Id); } set { return; } }
        protected Model Model { get; set; }

        internal void SetModel(Model m)
        {
            Model = m;
        }
    }
}
