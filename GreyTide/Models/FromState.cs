using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreyTideDataService.Models
{
    public class FromState
    {
        [Key]
        public string Name { get; set; }
        [ForeignKey("State")]
        public string StateId { get { return State?.Name; } set { return; } }
        public State State { get; set; }
    }
}