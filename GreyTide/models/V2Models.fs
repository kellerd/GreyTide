namespace GreyTide.Models.V2

open System
open System.ComponentModel.DataAnnotations

[<CLIMutable>]
type State = 
    { // { "order": 0,"name": "Dislike", "from": [< "none", "Completed" ?>], "to": "Requires Stripping" } 
      order : int
      name : string
      from : string seq
      ``to`` : string }

[<CLIMutable>]
type StateCollection = 
    { id : Guid
      name : string
      events : State seq }
    member x.``type`` = x.GetType().FullName

[<CLIMutable>]
type ModelState = 
    { [<Required>]
      name : string
      [<Required>]
      date : DateTime }

[<CLIMutable>]
type ModelItem = 
    { [<Required>]
      name : string
      [<Required>]
      currentState : string
      currentDate : string
      points : int
      states : ModelState seq }

[<CLIMutable>]
type Model = 
    { faction : string
      items : ModelItem seq
      [<Key>]
      id : Guid
      [<Required>]
      name : string
      [<Required>]
      currentState : string
      currentDate : string
      points : int
      states : ModelState seq
      userToken : string }
    member x.``type`` = x.GetType().FullName
