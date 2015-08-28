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

namespace GreyTideDataService
{
    public class Repo : ContextProvider
    {


        public class AsyncLazy<T> : Lazy<Task<T>>
        {
            public AsyncLazy(Func<T> valueFactory) :
                base(() => Task.Factory.StartNew(valueFactory),LazyThreadSafetyMode.ExecutionAndPublication) { }

            public AsyncLazy(Func<Task<T>> taskFactory) :
                base(() => Task.Factory.StartNew(() => taskFactory()).Unwrap(),LazyThreadSafetyMode.ExecutionAndPublication) { }

            public TaskAwaiter<T> GetAwaiter() { return Value.GetAwaiter(); }
        }

        public static Lazy<IEnumerable<ModelPart>> Models =
           new Lazy<IEnumerable<ModelPart>>(() => 
               JsonConvert.DeserializeObject<IEnumerable<ModelPart>>(
                       File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data/models.json"))
               ), LazyThreadSafetyMode.ExecutionAndPublication);

        public static Lazy<IEnumerable<StateCollection>> States =
           new Lazy<IEnumerable<StateCollection>>(() =>
               JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(
                File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data/states.json"))
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

        protected override string BuildJsonMetadata()
        {
            return null;
        }

        protected override void SaveChangesCore(SaveWorkState saveWorkState)
        {
            throw new NotImplementedException(); //Upload to azure
        }
    }
}