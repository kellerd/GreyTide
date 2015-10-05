using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Breeze.ContextProvider;
using GreyTideDataService.Models;
using Newtonsoft.Json;
using System.Linq;
using System.Threading;
using GreyTideDataService.Models.V2;

namespace GreyTideDataService
{
    public class Repo : ContextProvider
    {
        

        public class AsyncLazy<T> : Lazy<Task<T>>
        {
            public AsyncLazy(Func<T> valueFactory) :
                base(() => Task.Factory.StartNew(valueFactory), LazyThreadSafetyMode.ExecutionAndPublication)
            { }

            public AsyncLazy(Func<Task<T>> taskFactory) :
                base(() => Task.Factory.StartNew(() => taskFactory()).Unwrap(), LazyThreadSafetyMode.ExecutionAndPublication)
            { }

            public TaskAwaiter<T> GetAwaiter() { return Value.GetAwaiter(); }
        }

        public static Lazy<IEnumerable<Model>> Tide =
           new Lazy<IEnumerable<Model>>(() =>
           {
               var models = JsonConvert.DeserializeObject<IEnumerable<Model>>(File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data/models.json")));
               models.ToList().ForEach(process);
               return models;
           }, LazyThreadSafetyMode.ExecutionAndPublication);

        public static Lazy<IEnumerable<StateCollection>> States =
           new Lazy<IEnumerable<StateCollection>>(() =>
           {
               var states = JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data/states.json")));
               states.ToList().ForEach(processStates);
               return states;
           }, LazyThreadSafetyMode.ExecutionAndPublication);

        public override IDbConnection GetDbConnection()
        {
            return null;
        }

        protected override void OpenDbConnection()
        {
            throw new NotImplementedException();
        }

        protected override void CloseDbConnection()
        {
            throw new NotImplementedException();
        }
        
        protected override string BuildJsonMetadata()
        {
           
            throw new NotImplementedException(); 
        }

        protected override void SaveChangesCore(SaveWorkState saveWorkState)
        {
            throw new NotImplementedException(); //Upload to azure
        }
        private static void process(Model m)
        {
            m.States = m.States.OrderByDescending((s) => s.Date).ToList();
            var lastState = m.States.DefaultIfEmpty(new ModelState { Name = "Startup", Date = DateTime.Now }).FirstOrDefault();
            m.CurrentState = lastState.Name;
            m.CurrentDate = lastState.Date;
            if (m is Model) {
                ((Model)m).Id = Guid.NewGuid();
            }

            if (m.Items != null && m.Items.Any())
            {
                m.Items.ForEach((i) =>
                {
                    process(i);
                });
            }
        }
        private static void process(ModelItem m)
        {
            m.States = m.States.OrderByDescending((s) => s.Date).ToList();
            var lastState = m.States.DefaultIfEmpty(new ModelState { Name = "Startup", Date = DateTime.Now }).FirstOrDefault();
            m.CurrentState = lastState.Name;
            m.CurrentDate = lastState.Date;
        }
        private static void processStates(StateCollection sc)
        {
            sc.Id = Guid.NewGuid();
        }
    }
}