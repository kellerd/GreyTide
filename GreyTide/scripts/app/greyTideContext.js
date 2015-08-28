/// <reference path="../angular.js" />
var app = angular.module('greyTideApp');


app.factory('greyTideContext', ['breeze', function (breeze) {
   var manager, metadataStore;
    configureForBreeze();

    var datacontext = {
        clearCache: clearCache,
        createModel: createModel,
        createState: createState,
        deleteModel: deleteModel,
        deleteState: deleteState,
        getStates: getStates,
        metadataStore: metadataStore,
        saveNewModel: saveNewModel,
        saveNewState: saveNewState,
    };

    return datacontext;

    //#region Private Members

    function clearCache() {
        manager.clear();
    }

    function configureForBreeze() {
        breeze.NamingConvention.camelCase.setAsDefault();

        var dataService = new breeze.DataService({
            serviceName: "http://localhost:54040/breeze/GreyTide",
            hasServerMetadata: false // don't ask the server for metadata
        });

        manager = new breeze.EntityManager({ dataService: dataService });
        metadataStore = manager.metadataStore;
        configureManagerToSaveModifiedItemImmediately();
    }

    function configureManagerToSaveModifiedItemImmediately() {
        manager.entityChanged.subscribe(function (args) {
            if (args.entityAction === breeze.EntityAction.EntityStateChange) {
                var entity = args.entity;
                if (entity.entityAspect.entityState.isModified()) {
                    saveEntity(entity);
                }
            }
        });
    }
    
    function createModel(initialValues) {
        return manager.createEntity("Model", initialValues);
    }
    
    function createState(initialValues) {
        return manager.createEntity("State", initialValues);
    }
   
    function deleteModel(model) {
        model.entityAspect.setDeleted();
        return saveEntity(model);
    }
    
    function deleteState(state) {       
        state.entityAspect.setDeleted();
        return saveEntity(state);
    }

    function getStates(statesObservable, errorObservable) {
        return breeze.EntityQuery
            .from("States")
            .using(manager).execute()
            .then(getSucceeded)
            .catch(getFailed);

        function getSucceeded(data) {
            alter(data.results);
            //statesObservable(data.results);
        }

        function getFailed(error) {
            alert(error);
            //errorObservable("Error retrieving states: " + error.message);
        }
    }

    function saveEntity(masterEntity) {

        return manager.saveChanges().catch(saveFailed);

        function saveFailed(error) {
            setErrorMessage(error);
            // Let them see it "wrong" briefly before reverting"
            setTimeout(function() { manager.rejectChanges(); }, 1000);
            throw error; // so caller can see failure
        }

        function setErrorMessage(error) {
            var statename = masterEntity.entityAspect.entityState.name.toLowerCase();
            var typeName = masterEntity.entityType.shortName;
            var msg = "Error saving " + statename + " " + typeName + ": ";

            var reason = error.message;

            if (error.entityErrors) {
                reason = getValidationErrorMessage(error);
            } else if (isConcurrencyError(error)) {
                reason =
                    "can't find " + typeName + "; another user may have deleted it.";
            }
            masterEntity.errorMessage(msg + reason);
        }

        function getValidationErrorMessage(error) {
            try { // return the first error message
                var firstError = error.entityErrors[0];
                return firstError.errorMessage;
            } catch(e) { // ignore problem extracting error message 
                return "validation error";
            }
        }

        function isConcurrencyError(error) {
            var detail = error.detail;
            return detail && detail.ExceptionMessage &&
                detail.ExceptionMessage.match(/can't find/i);
        }
    }

    function saveNewModel(model) {
        return saveEntity(model);
    }

    function saveNewState(state) {
        return saveEntity(state);
    } 

    //#endregion
    return service;
}]);