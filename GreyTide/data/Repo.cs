using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using Breeze.ContextProvider;

using Newtonsoft.Json;
using System.Linq;
using System.Threading;
using GreyTide.Models.V2;
using GreyTide.data;

namespace GreyTide
{
    public class Repo : ContextProvider
    {
        public static string dir = AppDomain.CurrentDomain.BaseDirectory;

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

        public static Lazy<IEnumerable<Model>> Models =
           new Lazy<IEnumerable<Model>>(() =>
           {
               var models = JsonConvert.DeserializeObject<IEnumerable<Model>>(File.ReadAllText(Path.Combine(dir, "data/models.json")));
               models.ToList().ForEach(process);
               return models;
           }, LazyThreadSafetyMode.ExecutionAndPublication);

        public static Lazy<IEnumerable<StateCollection>> States =
           new Lazy<IEnumerable<StateCollection>>(() =>
           {
               var states = JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(File.ReadAllText(Path.Combine(dir, "data/states.json")));
               states.ToList().ForEach(process);
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
            m.states = m.states.OrderByDescending((s) => s.date).ToList();
            var lastState = m.states.DefaultIfEmpty(new ModelState { name = "Startup", date = DateTime.Now }).FirstOrDefault();
            m.currentState = lastState.name;
            m.currentDate = lastState.date;
            if (m.items != null && m.items.Any())
            {
                m.items.ForEach((i) =>
                {
                    process(i);
                });
            }
        }
        private static void process(ModelItem m)
        {
            m.states = m.states.OrderByDescending((s) => s.date).ToList();
            var lastState = m.states.DefaultIfEmpty(new ModelState { name = "Startup", date = DateTime.Now }).FirstOrDefault();
            m.currentState = lastState.name;
            m.currentDate = lastState.date;
        }

        private static void process(StateCollection obj)
        {
        }
    }
}