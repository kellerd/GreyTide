namespace GreyTide.Models.V1

open System
open System.ComponentModel.DataAnnotations

[<CLIMutable>]
type State = 
    { // { "order": 0,"name": "Dislike", "from": [< "none", "Completed" >], "to": "Requires Stripping" } 
      Order : int
      Id : Guid
      [<Required>]
      Name : string
      [<Required>]
      From : FromState seq
      [<Required>]
      To : string
      StateCollection : StateCollection }
    member this.StateCollectionId = this.StateCollection.Id

and StateCollection = 
    { UserToken : Guid
      [<Key>]
      Id : Guid
      [<Required>]
      Name : string
      Events : State seq }

and FromState = 
    { [<Key>]
      Id : Guid
      Name : string
      State : State }
    member this.StateId() = this.State.Id

[<CLIMutable>]
type Model = 
    { UserToken : Guid
      [<Key>]
      Id : Guid
      [<Required>]
      Name : string
      [<Required>]
      CurrentState : string
      CurrentDate : DateTime
      Faction : string option
      Points : int
      Items : Model seq
      States : ModelState seq
      Parent : Model option }
    member this.ParentId = Option.map (fun (s : Model) -> s.Id) this.Parent

and ModelState = 
    { [<Key>]
      Id : Guid
      [<Required>]
      Name : string
      [<Required>]
      Date : DateTime
      Model : Model }
    member this.ModelId = this.Model.Id
