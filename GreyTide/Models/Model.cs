using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GreyTideDataService.Models
{
    //{
    //    "name": "Hive Tyrant",
    //    "points": 255,
    //    "faction": "Tyranids",
    //    "states": [
    //        {
    //            "name": "Dislike",

    //            "date": "2015-01-01T12:50:46.822Z"
    //        },
    //        {
    //            "name": "Buy Completed",

    //            "date": "2015-01-01T12:50:26.082Z"
    //        },
    //        {
    //            "name": "Startup",

    //            "date": "2015-01-01T12:49:20.789Z"
    //        }
    //    ],
    //    "items": []
    //},
    //public class ModelPart
    //{
    //    [Required]
    //    public string name { get; set; }
    //    public int points { get; set; }
    //    public List<ModelPartState>  States{ get; set; }
    //}
    public class ModelPart
    {
        public Guid UserToken { get; set; }
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Name { get; set; }
        public string Faction { get; set; }
        public int Points { get; set; }
        public List<ModelPart> Items { get; set; }
        public List<ModelPartState>  States{ get; set; }
    }
}