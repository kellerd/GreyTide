/// <reference path="../scripts/angular.js" />
/// <reference path="../scripts/breeze.min.js.js" />
var app = angular.module('greyTideApp');


app.factory('greyTideContext', ['breeze', function (breeze) {
    var manager, metadataStore;

    function Model() {    // my constructor function

    };



    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
    }

    Model.prototype = {

        //onpanic: function (event, from, to) { alert('panic'); },
        //onclear: function (event, from, to) { alert('all is clear'); },
        onafterevent: function (event, from, to) {
            if (this.states.length == 0 || this.states[0].name != event) {
                this.states.push(manager.createEntity("ModelState", { id: guid(), name: event, date: new Date().toISOString(), active: true, modelId: this.modelId }));
                this.allStates = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.states).Where(function (s) { return s.active })).ToArray();


                if (this.parentEntity != null) {
                    var p = this.parentEntity;
                    if (Enumerable.From(this.parentEntity.items).Select(function (item) { return item.current; }).Distinct().Count() == 1) {
                        var state = Enumerable.From(p.allStates).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault();
                        if (!(typeof state === 'undefined')) {
                            state.active = true;
                            state.date = new Date().toISOString();
                            p[event].call(p);
                        }
                    }
                }
                if (this.items != null && this.items.length > 0)
                    Enumerable.From(this.items).ForEach(function (p) {
                        if (Enumerable.From(p.transitions()).Contains(event)) {
                            var state = Enumerable.From(p.allStates).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault();
                            if (!(typeof state === 'undefined')) {
                                state.active = true;
                                state.date = new Date().toISOString();
                                p[event].call(p);
                            }
                        }
                    })
            } else {
                this.allStates = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.states).Where(function (s) { return s.active })).ToArray();
            }
           


        }
    };

    var ModelInitializer = function (model) {
        model[model.currentState].call(model);
    };

    configureForBreeze();
    configureConstructors();

    var datacontext = {
        clearCache: clearCache,
        models: CreateUpdateSave("Model", function (name) { return breeze.EntityQuery.from(name).expand("states,items"); }),
        states: CreateUpdateSave("State", function (name) { return breeze.EntityQuery.from(name).expand("events.from"); }),
        guidGenerator: guid,
        metadataStore: metadataStore,
    };

    datacontext.states.get(function (data) {
        var events = data[0].events.map(function (e) {
            return {
                name: e.name,
                from: e.from.map(function (f) { return f.name; }),
                to: e.to
            }
        });
        StateMachine.create({
            target: Model.prototype,
            initial: { state: 'None', event: 'init', defer: true },
            events: events
        });
    }, function (error) {
        alert(error);
    });

    //#region Private Members

    function clearCache() {
        manager.clear();
    }

    function configureForBreeze() {
        breeze.NamingConvention.camelCase.setAsDefault();

        var dataServiceName = "breeze/GreyTide";
        manager = new breeze.EntityManager(dataServiceName);
        metadataStore = manager.metadataStore;
        configureManagerToSaveModifiedItemImmediately();
    }

    function configureManagerToSaveModifiedItemImmediately() {
        manager.entityChanged.subscribe(function (args) {
            if (args.entityAction === breeze.EntityAction.EntityStateChange) {
                var entity = args.entity;
                if (entity.entityAspect.entityState.isAddedModifiedorDeleted()) {
                    saveEntity(entity);
                }
            }
        });
    }

    function configureConstructors() {
        metadataStore.registerEntityTypeCtor('Model', Model, ModelInitializer);
    }
    function CreateUpdateSave(modelName, breezeQueryFactory) {
        var localModelName = modelName;
        var dataSet = {
            create: create,
            remove: remove,
            get: get,
            save: saveEntity
        };
        function create(initialValues) {
            return manager.createEntity(localModelName, initialValues);
        }

        function remove(model) {
            model.entityAspect.setDeleted();
            return saveEntity(model);
        }

        function get(successFunction, errorFunction) {

            return breezeQueryFactory(localModelName + "s")
                .using(manager).execute()
                .then(getSucceeded)
                .catch(getFailed);

            function getSucceeded(data) {
                successFunction(data.results);
            }

            function getFailed(error) {
                errorFunction("Error retrieving states: " + error.message);
            }
        }

        return dataSet;
    }

    function saveEntity(masterEntity) {

        return manager.saveChanges().catch(saveFailed);

        function saveFailed(error) {
            setErrorMessage(error);
            // Let them see it "wrong" briefly before reverting"
            setTimeout(function () { manager.rejectChanges(); }, 1000);
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
            } catch (e) { // ignore problem extracting error message 
                return "validation error";
            }
        }

        function isConcurrencyError(error) {
            var detail = error.detail;
            return detail && detail.ExceptionMessage &&
                detail.ExceptionMessage.match(/can't find/i);
        }
    }


    return datacontext;
}]);