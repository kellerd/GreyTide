namespace GreyTideSuave
module Repo =
    open System
    open System.Collections.Generic
    open System.IO
    open Breeze.ContextProvider
    open Newtonsoft.Json
    open System.Linq
    open System.Threading
    open GreyTide.Models.V2

    type Repo() = 
        inherit ContextProvider()
        let mutable dir = AppDomain.CurrentDomain.BaseDirectory

        let processI (m:ModelItem) = 
            m.states <- m.states.OrderByDescending(fun (s) -> s.date).ToList()
            let lastState = m.states.DefaultIfEmpty(new ModelState ( name = "Startup", date = DateTime.Now )).FirstOrDefault()
            m.currentState <- lastState.name
            m.currentDate <- lastState.date
            m
        let processM (m:Model) = 
            m.states <- m.states.OrderByDescending((s) => s.date).ToList();
            let lastState = m.states.DefaultIfEmpty(new ModelState ( name = "Startup", date = DateTime.Now )).FirstOrDefault();
            m.currentState <- lastState.name;
            m.currentDate <- lastState.date;
            m.items |> Option.ofObj |> Option.iter(Seq.iter (processI >> ignore))
            m
        let processS s = s

        member x.Models = lazy (
               JsonConvert.DeserializeObject<IEnumerable<Model>>(File.ReadAllText(Path.Combine(dir, "data/models.json")))
               |> Seq.map(processM)
               |> ResizeArray<_>, LazyThreadSafetyMode.ExecutionAndPublication)
        member x.States = lazy (
               JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(File.ReadAllText(Path.Combine(dir, "data/states.json")))
               |> Seq.map(processS)
               |> ResizeArray<_>, LazyThreadSafetyMode.ExecutionAndPublication)


//        public static Lazy<IEnumerable<StateCollection>> States =
//           new Lazy<IEnumerable<StateCollection>>(() =>
//           {
//               var states = JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(File.ReadAllText(Path.Combine(dir, "data/states.json")));
//               states.ToList().ForEach(process);
//               return states;
//           }, LazyThreadSafetyMode.ExecutionAndPublication);
//
//
//        public override IDbConnection GetDbConnection()
//        {
//            return null;
//        }
//
//        protected override void OpenDbConnection()
//        {
//            throw new NotImplementedException();
//        }
//
//        protected override void CloseDbConnection()
//        {
//            throw new NotImplementedException();
//        }
//        
//        protected override string BuildJsonMetadata()
//        {
//           
//            throw new NotImplementedException(); 
//        }
//
//        protected override void SaveChangesCore(SaveWorkState saveWorkState)
//        {
//            throw new NotImplementedException(); //Upload to azure
//        }
//        private static void process(Model m)
//        {
//            m.states = m.states.OrderByDescending((s) => s.date).ToList();
//            var lastState = m.states.DefaultIfEmpty(new ModelState { name = "Startup", date = DateTime.Now }).FirstOrDefault();
//            m.currentState = lastState.name;
//            m.currentDate = lastState.date;
//            if (m.items != null && m.items.Any())
//            {
//                m.items.ForEach((i) =>
//                {
//                    process(i);
//                });
//            }
//        }
//        private static void process(ModelItem m)
//        {
//            m.states = m.states.OrderByDescending((s) => s.date).ToList();
//            var lastState = m.states.DefaultIfEmpty(new ModelState { name = "Startup", date = DateTime.Now }).FirstOrDefault();
//            m.currentState = lastState.name;
//            m.currentDate = lastState.date;
//        }
//
//        private static void process(StateCollection obj)
//        {
//        }
    }
}