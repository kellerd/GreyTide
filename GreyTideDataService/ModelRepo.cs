using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using GreyTideDataService.Models;
using Newtonsoft.Json;

namespace GreyTideDataService
{
    public class Repo
    {


        public class AsyncLazy<T> : Lazy<Task<T>>
        {
            public AsyncLazy(Func<T> valueFactory) :
                base(() => Task.Factory.StartNew(valueFactory),LazyThreadSafetyMode.ExecutionAndPublication) { }

            public AsyncLazy(Func<Task<T>> taskFactory) :
                base(() => Task.Factory.StartNew(() => taskFactory()).Unwrap(),LazyThreadSafetyMode.ExecutionAndPublication) { }

            public TaskAwaiter<T> GetAwaiter() { return Value.GetAwaiter(); }
        }

        public static AsyncLazy<IEnumerable<ModelPart>> Models =
           new AsyncLazy<IEnumerable<ModelPart>>(() => 
               JsonConvert.DeserializeObject<IEnumerable<ModelPart>>(
                       File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data/models.json"))
               ));

        public static AsyncLazy<IEnumerable<StateCollection>> States =
           new AsyncLazy<IEnumerable<StateCollection>>(() =>
               JsonConvert.DeserializeObject<IEnumerable<StateCollection>>(
                File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data/states.json"))
               ));
    }
}