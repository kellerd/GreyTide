namespace GreyTide.Models.V2
    open System
    open System.Collections.Generic
    open System.ComponentModel.DataAnnotations
    type ITypeable = 
        abstract ``type``: string
    type State =    {
        // { "order": 0,"name": "Dislike", "from": [< "none", "Completed" ?>], "to": "Requires Stripping" } 
        order : int; 
        [<Required>] name : string; 
        [<Required>] from : ResizeArray<string>; 
        [<Required>] ``to`` : string; 
    }
    type StateCollection =  
        {   [<Key>] id : Guid; 
            [<Required>] name : string; 
            events : ResizeArray<State>; } 
        interface ITypeable with
            override x.``type`` = x.GetType().FullName
    type ModelState =
        { [<Required>] name : string; 
          [<Required>] date : DateTime; }
    type ModelItem = 
        { [<Required>] name : string
          [<Required>]  currentState  : string
          currentDate : string
          points : int
          states : ResizeArray<ModelState> }
    
    type Model =  
        {   faction : string 
            items : ResizeArray<ModelItem>
            [<Key>] id : Guid
            [<Required>] name : string
            [<Required>]  currentState  : string
            currentDate : string
            points : int
            states : ResizeArray<ModelState> }
        interface ITypeable with
            override x.``type`` = x.GetType().FullName