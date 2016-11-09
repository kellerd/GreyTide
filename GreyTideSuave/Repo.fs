namespace GreyTideSuave
module Repo =
    open System.IO
    open Newtonsoft.Json
    open System.Linq
    open System.Threading
    open GreyTide.Models.V2
    
    open System;
    open System.Collections.Generic;
    open Breeze.ContextProvider;
    open Newtonsoft.Json.Linq;
    open MapperConfiguration

    type Repo ()  = 
        inherit ContextProvider()
        let mutable dir = AppDomain.CurrentDomain.BaseDirectory

        let processI (m:ModelItem) = 
            let orderedStates = m.states.OrderByDescending(fun (s) -> s.date).ToList()
            let lastState = orderedStates.DefaultIfEmpty({name = "Startup"; date = DateTime.Now}).FirstOrDefault()
            {m with states = orderedStates; currentState = lastState.name; currentDate = lastState.date.ToString()}
        let processM (m:Model) = 
            let orderedStates = m.states.OrderByDescending(fun (s) -> s.date).ToList()
            let lastState = orderedStates.DefaultIfEmpty({name = "Startup"; date = DateTime.Now}).FirstOrDefault()
            remap m.items processI
            {m with states = orderedStates; currentState = lastState.name; currentDate = lastState.date.ToString();  }
        let processS s = s

        member x.Models = lazy (
               JsonConvert.DeserializeObject<IEnumerable<Model>>(File.ReadAllText(Path.Combine(dir, "data/models.json")))
               |> Seq.map(processM)
               |> ResizeArray<_>)
        member x.States = lazy ( JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(File.ReadAllText(Path.Combine(dir, "data/states.json")))
                                     |> Seq.map(processS)
                                     |> ResizeArray<_>)
               
        static member Convert (saveBundle,beforeSaveEntity,beforeSaveEntities) =
            let provider = new Repo(BeforeSaveEntityDelegate = beforeSaveEntity, BeforeSaveEntitiesDelegate = beforeSaveEntities)
            provider.InitializeSaveState(saveBundle)
            provider.SaveWorkState.BeforeSave()
            provider.SaveWorkState.SaveMap

        override x.GetDbConnection() = raise (NotImplementedException())
        override x.OpenDbConnection() = raise (NotImplementedException())
        override x.CloseDbConnection() = raise (NotImplementedException())
        override x.BuildJsonMetadata() = raise (NotImplementedException())
        override x.SaveChangesCore( saveWorkState:Breeze.ContextProvider.SaveWorkState) = raise (NotImplementedException())
