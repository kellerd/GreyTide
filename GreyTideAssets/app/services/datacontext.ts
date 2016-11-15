/// <reference path="entityManagerFactory.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />
/// <reference path="../../scripts/typings/statemachine/statemachine.d.ts" />
/// <reference path="../app.ts" />
/// <reference path="../config.ts" />
/// <reference path="../common/logger.ts" />
'use strict'
module App.Services {

    export interface IDatacontext {
        getTideAndState(): ng.IPromise<ITideAndState>;
        getTide(): ng.IPromise<any>;
        getStates(): ng.IPromise<any>;
        prime(): void;
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

        constructor(private common: App.Shared.ICommon, entityManagerFactory: IEntityManagerFactory, private config: IConfigurations) {
            this.$q = common.$q;
            this.logger = common.logger;
            this.EntityQuery = breeze.EntityQuery;
            this.manager = entityManagerFactory.newManager(this.saveEntity);
        }
        create(localModelName: string, initialValues?: {}, isComplexType?: boolean, entityState?: breeze.EntityStateSymbol, mergeStrategy?: breeze.MergeStrategySymbol): any {
            if (isComplexType) {
                let type = <breeze.ComplexType>this.manager.manager.metadataStore.getEntityType(localModelName);
                return type.createInstance(initialValues);
            }
            return this.manager.manager.createEntity(localModelName, initialValues, entityState, mergeStrategy);
        }

        public getTide(): ng.IPromise<any> {
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

        public saveEntity = (masterEntity) => {

            //_that.common.debouncedThrottle("entityChanges", function () {
            //    saveEntity(entity);
            //    _that.common.logger.log("Saved item", entity, "", true);
            //    return true;
            //}
            //        }, 300, false);
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
        public prime(): void {
            this.getStates().then((data) => {
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
            });
        }
    }

    // Register with angular
    app.factory(Datacontext.serviceId, ['common', EntityManagerFactory.serviceId, 'config', (common, entityManagerFactory, config) => new Datacontext(common, entityManagerFactory, config)]);

}
