'use strict'
module App.Services {

    export interface IDatacontext {
        getTideAndState(): ng.IPromise<ITideAndState>;
        getTide(): ng.IPromise<any>;
        getStates(): ng.IPromise<any>;
        prime(): void;
        cancel(): void;
        markDeleted(entity): any;
        create(localModelName: string, initialValues?: {}, isComplexType?: boolean, entityState?: breeze.EntityStateSymbol, mergeStrategy?: breeze.MergeStrategySymbol): any
        saveEntity(masterEntity: any): ng.IPromise<any>;
    }

    export interface ITideAndState {
        states: any;
        tide: any;
    }

    export class Datacontext implements IDatacontext {
        public static serviceId: string = 'datacontext';
        private $q: ng.IQService;

        private logger: App.Shared.ILogger;
        private EntityQuery: typeof breeze.EntityQuery;
        private manager: IManagerAndMetaModels;

        constructor(private $injector: ng.auto.IInjectorService, private $rootScope: ng.IRootScopeService, private common: App.Shared.ICommon, entityManagerFactory: IEntityManagerFactory, private config: IConfigurations, private zStorage, public zStorageWip) {
            this.$q = common.$q;
            this.logger = common.logger;
            this.EntityQuery = breeze.EntityQuery;
            this.manager = entityManagerFactory.newManager(this.saveEntity);
            this.init();
        }
        create(localModelName: string, initialValues?: {}, isComplexType?: boolean, entityState?: breeze.EntityStateSymbol, mergeStrategy?: breeze.MergeStrategySymbol): any {
            if (isComplexType) {
                let type = <breeze.ComplexType>this.manager.manager.metadataStore.getEntityType(localModelName);
                return type.createInstance(initialValues);
            }
            return this.manager.manager.createEntity(localModelName, initialValues, entityState, mergeStrategy);
        }

        getTide(): ng.IPromise<any> {
            var tide;

            var getSucceeded = (data) => {
                tide = data.results;
                this.logger.logSuccess("Retrieved [Models] from remote data source", tide.length, null, true);
                return tide;
            }
            return this.EntityQuery.from("Models")
                .using(this.manager.manager).execute()
                .then(getSucceeded)
                .catch(this.getFailed);

        }

        cancel() {
            if (this.manager.manager.hasChanges()) {
                this.manager.manager.rejectChanges();
                this.logger.logSuccess('Canceled changes', null, Datacontext.serviceId, true);
            }
        }
        markDeleted(entity) {
            return entity.entityAspect.setDeleted();
        }

        storeWipEntity(entity, wipEntityKey, entityName, description, routeState) {
            if (!entity) return;
            var wipEntityKey = this.zStorageWip.storeWipEntity(entity, wipEntityKey, entityName, description, routeState);
            return wipEntityKey;
        }


        saveEntity = (masterEntity) => {
            var _that = this;
            return _that.common.queuePromise("entityChanges", function () {
                return _that.manager.manager.saveChanges().catch(saveFailed);
            }, 0, true);

            function saveFailed(error) {
                setErrorMessage(error);
                // Let them see it "wrong" briefly before reverting"
                setTimeout(function () { _that.manager.manager.rejectChanges(); }, 1000);
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
                _that.common.logger.log(msg + reason, masterEntity, "Save changes", true);
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

        private getFailed = (error) => {
            var msg = this.config.appErrorPrefix + "Error retrieving states: " + error.message;
            this.common.logger.logError(msg, null, error, true);
            throw error;
        }

        public getStates(): ng.IPromise<any> {
            var states;

            var getSucceeded = (data) => {
                states = data.results;
                this.common.logger.log("Retrieved [States] from remote data source", states.length, null, true);
                return states;
            }
            return this.EntityQuery.from("States")
                .using(this.manager.manager).execute()
                .then(getSucceeded)
                .catch(this.getFailed);

        }
        public getTideAndState(): ng.IPromise<ITideAndState> {
            return this.$q.all([this.getStates(), this.getTide()]).then((dataArray) => {
                return <ITideAndState>{ states: dataArray[0], tide: dataArray[1] };
            });
        }

        private primePromise: ng.IPromise<any>;
        public prime(): ng.IPromise<any> {
            // There are many paths through here, all must return a promise.

            // This function can only be called once.
            if (this.primePromise) return this.primePromise; 

            // look in local storage, if data is here, 
            // grab it. otherwise get from 'resources'
            var storageEnabledAndHasData = this.zStorage.load(this.manager);
            var promise = storageEnabledAndHasData ?
                this.$q.when(this.logger.logSuccess('Loading entities and metadata from local storage', null, Datacontext.serviceId, true)) :
                loadLookupsFromRemote();

            this.primePromise = promise.then(success);
            return this.primePromise;

            function loadLookupsFromRemote() {
                // get lookups and speakers from remote data source, in parallel
                var promise = this.$q.all([getStatesAndProcess(), this.getTide()]);
                //if (!model.useManualMetadata) {
                //    // got metadata from remote service; now extend it
                //    promise = promise.then(function () {
                //        model.extendMetadata(manager.metadataStore);
                //    });
                //}
                return promise.then(function () { this.zStorage.save(); });
            }


            function success() {
                this.logger.log('Primed data', null, Datacontext.serviceId, true);
            }


            var getStatesAndProcess = () => {
                return this.getStates().then((data) => {
                    var events = data[0].events.map((e) => {
                        return {
                            name: e.name,
                            from: e.from,
                            to: e.to
                        }
                    });
                    StateMachine.create({
                        target: this.manager.Model.prototype,
                        initial: { state: 'None', event: 'init', defer: true },
                        events: events
                    });
                    StateMachine.create({
                        target: this.manager.ModelItem.prototype,
                        initial: { state: 'None', event: 'init', defer: true },
                        events: events
                    });
                    this.common.logger.log("States primed", null, "", true);
                }, (error) => {
                    this.common.logger.logError(error, null, Datacontext.serviceId, true);
                })
            };
        }

        private init() {
            this.zStorage.init(this.manager);
            this.zStorageWip.init(this.manager);
            this.defineLazyLoadedRepos();
            this.setupEventForHasChangesChanged();
            this.setupEventForEntitiesChanged();
            this.listenForStorageEvents();
        }

        private listenForStorageEvents() {
            this.$rootScope.$on(this.config.events.storage.storeChanged, (event, data) => {
                this.logger.log('Updated local storage', data, "", true);
            });
            this.$rootScope.$on(this.config.events.storage.wipChanged, (event, data)  => {
                this.logger.log('Updated WIP', data, "", true);
            });
            this.$rootScope.$on(this.config.events.storage.error, (event, data)  => {
                this.logger.logError('Error with local storage. ' + data.activity, data, "", true);
            });
        }

//#region Repository
        //private repoNames = ['attendee', 'lookup', 'session', 'speaker'];
        private defineLazyLoadedRepos() {                     
            //this.repoNames.forEach(function (name) {
            //    Object.defineProperty(this, name, {
            //        configurable: true, // will redefine this property once
            //        get: function () {
            //            // The 1st time the repo is request via this property, 
            //            // we ask the repositories for it (which will inject it).
            //            var repo = this.getRepo(name);
            //            // Rewrite this property to always return this repo;
            //            // no longer redefinable
            //            Object.defineProperty(this, name, {
            //                value: repo,
            //                configurable: false,
            //                enumerable: true
            //            });
            //            return repo;
            //        }
            //    });
            //});
        }
        private getRepo(repoName) {
            //var fullRepoName = 'repository.' + repoName.toLowerCase();
            //var factory = this.$injector.get(fullRepoName);
            //return (<any>factory).create(this.manager);
        }
//#endregion

        // Forget certain changes by removing them from the entity's originalValues
        // This function becomes unnecessary if Breeze decides that
        // unmapped properties are not recorded in originalValues
        //
        // We do this so we can remove the isSpeaker and isPartial properties from
        // the originalValues of an entity. Otherwise, when the object's changes
        // are canceled these values will also reset: isPartial will go
        // from false to true, and force the controller to refetch the
        // entity from the server.
        // Ultimately, we do not want to track changes to these properties, 
        // so we remove them.        
        private interceptPropertyChange(changeArgs) {
            //var changedProp = changeArgs.args.propertyName;
            //if (changedProp === 'isPartial' || changedProp === 'isSpeaker') {
            //    delete changeArgs.entity.entityAspect.originalValues[changedProp];
            //}
        }

        private setupEventForEntitiesChanged() {
            // We use this for detecting changes of any kind so we can save them to local storage
            this.manager.manager.entityChanged.subscribe((args) => {
                if ((args.entityAction === breeze.EntityAction.PropertyChange && (args.entity.entityAspect.entityState.isAdded() || args.entity.entityAspect.entityState.isModified())) ||
                    (args.entityAction === breeze.EntityAction.EntityStateChange && args.entity.entityAspect.entityState.isDeleted())) {
                    this.interceptPropertyChange(args);
                    this.common.$broadcast(this.config.events.entitiesChanged, args);
                }
            });

            //this would go in controller
            //mgr.entityChanged.subscribe(function (args) {
            //    if ((args.entityAction === breeze.EntityAction.PropertyChange && (args.entity.entityAspect.entityState.isAdded() || args.entity.entityAspect.entityState.isModified())) ||
            //        (args.entityAction === breeze.EntityAction.EntityStateChange && args.entity.entityAspect.entityState.isDeleted())) {
            //        let entity = args.entity;
            //        saveEntity(entity).
            //            then(function () { return _that.common.logger.logSuccess("Saved item", entity, "", true); }).
            //            catch(function (reason) { return _that.common.logger.logError("Error saving item", entity, reason, true); });
            //    }
            //});
        }

        private setupEventForHasChangesChanged() {
            this.manager.manager.hasChangesChanged.subscribe((eventArgs) => {
                var data = { hasChanges: eventArgs.hasChanges };
                this.common.$broadcast(this.config.events.hasChangesChanged, data);
            });
        }

    }

    // Register with angular
    app.factory(Datacontext.serviceId, ['$injector', '$rootScope', 'common', EntityManagerFactory.serviceId, 'config', 'zStorage', 'zStorageWip', (injector, rootScope, common, entityManagerFactory, config, zStorage, zStorageWip) => new Datacontext(injector, rootScope, common, entityManagerFactory, config, zStorage, zStorageWip)]);

}
