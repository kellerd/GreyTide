
namespace GreyTide.Models.V1
    open System
    open System.ComponentModel.DataAnnotations

    [<CLIMutable>]
    type State =  
        // { "order": 0,"name": "Dislike", "from": [< "none", "Completed" >], "to": "Requires Stripping" } 
        { Order : int; 
          Id : Guid; 
          [<Required>] Name : string;
          [<Required>] From : ResizeArray<FromState>; 
          [<Required>] To : string; 
          StateCollection : StateCollection } 
        with member this.StateCollectionId = this.StateCollection.Id

    and StateCollection =    
        { UserToken : Guid; 
          [<Key>] Id : Guid; 
          [<Required>] Name : string; 
          Events : ResizeArray<State>;  }

    and FromState =    
        { [<Key>] Id : Guid; 
          Name : string; 
          State :  State option}
        with member this.StateId() = defaultArg (Option.map (fun (s:State) -> s.Id) this.State) Guid.Empty
    [<CLIMutable>]
    type Model =    
        { UserToken : Guid; 
          [<Key>] Id : Guid; 
          [<Required>] Name : string; 
          [<Required>] CurrentState : string; 
          CurrentDate : DateTime; 
          Faction : string; 
          Points : int; 
          Items : ResizeArray<Model>; 
          States :  ResizeArray<ModelState>
          Parent : Model }
        with member this.ParentId =  this.Parent.Id
    and ModelState =   
        { [<Key>] Id : Guid; 
          [<Required>] Name : string; 
          [<Required>] Date : DateTime; 
          Model : Model } 
        with member this.ModelId = this.Model.Id
