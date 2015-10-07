using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTide.Models.V1
{
    public class Model
    {
        public Guid UserToken { get; set; }
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string CurrentState { get; set; }
        public DateTime CurrentDate { get; set; }
        public string Faction { get; set; }
        public int Points { get; set; }
        public List<Model> Items { get; set; }
        public List<ModelState>  States{ get; set; }
        public Guid ParentId { get { return (Parent == null ? Guid.Empty : Parent.Id); } set { return; } }
        protected Model Parent { get; set; }

        public void SetParent(Model m)
        {
            Parent = m;
        }
    }
}