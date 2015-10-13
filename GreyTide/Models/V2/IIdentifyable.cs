using System;

namespace GreyTide.Models.V2
{
    public interface IIdentifyable
    {
         Guid id { get; set; }
    }
}