using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTideDataService.Models
{
   public class ModelState
   {
        [Key]
       public Guid Id { get; set; }
       [Required]
       public string Name { get; set; }
       [Required]
       public DateTime Date { get; set; }
        public Guid ModelId { get { return (Model == null ? Guid.Empty : Model.Id); } set { return; } }
        protected Model Model { get; set; }

        public void SetModel(Model m)
        {
            Model = m;
        }
    }
}
