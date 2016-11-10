namespace GreyTideSuave

module MapperConfiguration = 
    open System
    open GreyTide.Models
    
    let mapModelState model (v2 : V2.ModelState) : V1.ModelState = 
        { Id = Guid.NewGuid()
          Name = v2.name
          Date = v2.date
          Model = model }
    
    let mapModelItems model (v2 : V2.ModelItem) : V1.Model = 
        let x : V1.Model = 
            { UserToken = Guid.Empty
              Id = Guid.Empty
              Name = v2.name
              CurrentState = v2.currentState
              CurrentDate = DateTime.Parse(v2.currentDate)
              Faction = None
              Points = v2.points
              Items = Seq.empty
              States = Seq.empty
              Parent = model }
        { x with States = Seq.map (mapModelState x) v2.states }
    
    let mapModels (v2 : V2.Model) : V1.Model = 
        let x : V1.Model = 
            { UserToken = Guid.Empty
              Id = v2.id
              Name = v2.name
              CurrentState = v2.currentState
              CurrentDate = DateTime.Parse(v2.currentDate)
              Faction = Some v2.faction
              Points = v2.points
              Items = Seq.empty
              States = Seq.empty
              Parent = None }
        { x with States = Seq.map (mapModelState x) v2.states
                 Items = Seq.map (mapModelItems (Some x)) v2.items }
    
    let mapFromState state str : V1.FromState = 
        { Id = Guid.NewGuid()
          Name = str
          State = state }
    
    let mapStates stateCollection (v2 : V2.State) : V1.State = 
        let x : V1.State = 
            { Order = v2.order
              Id = Guid.NewGuid()
              Name = v2.name
              From = Seq.empty
              To = v2.``to``
              StateCollection = stateCollection }
        { x with From = Seq.map (mapFromState x) v2.from }
    
    let mapStateCollection (v2 : V2.StateCollection) : V1.StateCollection = 
        let x : V1.StateCollection = 
            { UserToken = Guid.Empty
              Id = v2.id
              Name = v2.name
              Events = Seq.empty }
        { x with Events = Seq.map (mapStates x) v2.events }
