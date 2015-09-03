using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Breeze.ContextProvider;
using GreyTideDataService.Models;
using Newtonsoft.Json;
using Breeze.ContextProvider.EF6;
using System.Linq;
using System.Data.Entity;

namespace GreyTideDataService
{
    public class Repo : ContextProvider
    {
        static Repo()
        {
            Database.SetInitializer<GreyTideContext>(null);
        }

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
               var models = JsonConvert.DeserializeObject<IEnumerable<Model>>(
File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data/models.json"))
);
               
               models.ToList().ForEach(process);
               return models;
           }, LazyThreadSafetyMode.ExecutionAndPublication);

        public static Lazy<IEnumerable<StateCollection>> States =
           new Lazy<IEnumerable<StateCollection>>(() =>
               JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(
                File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data/states.json"))
               ), LazyThreadSafetyMode.ExecutionAndPublication);

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
        public static EFContextProvider<GreyTideContext> MetadataConects =
            new EFContextProvider<GreyTideContext>();
        protected override string BuildJsonMetadata()
        {
            return MetadataConects.Metadata();
        }

        protected override void SaveChangesCore(SaveWorkState saveWorkState)
        {
            throw new NotImplementedException(); //Upload to azure
        }
        private static void process  (Model m)
        {
            var lastState = m.States.OrderByDescending((s) => s.Date).DefaultIfEmpty(new ModelState { Name = "Startup", Date = DateTime.Now }).FirstOrDefault();
            m.Current = lastState.Name;
            m.CurrentDate = lastState.Date;
            if (m.Items != null && m.Items.Any())
                m.Items.ForEach(process);
        }
    }
}