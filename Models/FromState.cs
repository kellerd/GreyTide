using System;
using System.ComponentModel.DataAnnotations;

namespace GreyTideDataService.Models
{
    public class FromState
    {
        [Key]
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid StateId { get { return State.Id; } set { return; } }
        protected State State { get; set; }

        public void SetState(State s)
        {
            State = s;
        }
    }
}