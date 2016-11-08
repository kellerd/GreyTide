namespace GreyTideSuave
module Data = 

    open System;
    open System.Collections.Generic;
    open System.Data;
    open Breeze.ContextProvider;
    open Newtonsoft.Json.Linq;

    /// <summary>
    /// A demonstration of technique to convert a saveBundle into a SaveMap
    /// for use by custom server code that didn't want to use a ContextProvider to handle
    /// change-set saves.
    /// </summary>
    /// <remarks>
    /// This class leverages utilities within the base ContextProvider to effect this conversion
    /// It is NOT a functioning ContextProvider!
    /// There are no examples of usage yet.
    /// </remarks>
    type SaveBundleToSaveMap private () as x =
        inherit ContextProvider()
        // Never create a public instance

        /// <summary>
        /// Convert a saveBundle into a SaveMap
        /// </summary>
        /// <param name="saveBundle">JSON object from client describing batch save</param>
        /// <param name="beforeSaveEntity">
        ///   optional function to evaluate each entity individually before it is saved.
        /// </param>
        /// <param name="beforeSaveEntities">
        ///   optional function to evaluate the entire collection of entities before they are saved.
        /// </param>
        member x.Convert (saveBundle:JObject,beforeSaveEntity,beforeSaveEntities) =
//          Func<EntityInfo, bool> option,
//          Func<Dictionary<Type, List<EntityInfo>>, Dictionary<Type, List<EntityInfo>>> beforeSaveEntities = null)
            let provider = new SaveBundleToSaveMap(BeforeSaveEntityDelegate = beforeSaveEntity, BeforeSaveEntitiesDelegate = beforeSaveEntities)
            provider.InitializeSaveState(saveBundle)
            provider.SaveWorkState.BeforeSave()
            provider.SaveWorkState.SaveMap

        member x.GetDbConnection = raise (NotImplementedException())
        member x.OpenDbConnection() = raise (NotImplementedException())
        member x.CloseDbConnection() = raise (NotImplementedException())
        member x.BuildJsonMetadata() = raise (NotImplementedException())
        member x.SaveChangesCore(saveWorkState) = raise (NotImplementedException())
