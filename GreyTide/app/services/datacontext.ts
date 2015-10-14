'use strict'
module App.Services {

    export interface IDatacontext {
        getTideAndState(): ng.IPromise<ITideAndState>;
        getTide(): ng.IPromise<any>;
        getStates(): ng.IPromise<any>;
        prime(): void;
        create(localModelName: string, initialValues?: {}, isComplexType?: boolean, entityState?: breeze.EntityStateSymbol, mergeStrategy?: breeze.MergeStrategySymbol): any
        saveEntity(masterEntity: any): void;
    }

    export interface ITideAndState {
        states: any;
        tide: any;
    }

    export class Datacontext implements IDatacontext {
        public static serviceId: string = 'datacontext';
        private $q: ng.IQService;

        private getLogFn: (moduleId: string, fnName?: string)=>any;
        private logError: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        private logSuccess: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        private log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        private EntityQuery: typeof breeze.EntityQuery;
        private manager: IManagerAndMetaModels;

        constructor(private common: App.Shared.ICommon, entityManagerFactory: IEntityManagerFactory, private config:IConfigurations) {
            this.$q = common.$q;
            this.log = common.logger.log;
            this.logError = common.logger.logError;
            this.logSuccess = common.logger.logSuccess;
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
                this.log("Retrieved [Models] from remote data source", tide.length, null, true);
                return tide;
            }
            return this.EntityQuery.from("Models")
                .using(this.manager.manager).execute()
                .then(getSucceeded)
                .catch(this.getFailed);

        }

        public  saveEntity = (masterEntity) => {

            return this.manager.manager.saveChanges().catch(saveFailed);

            function saveFailed(error) {
                setErrorMessage(error);
                // Let them see it "wrong" briefly before reverting"
                setTimeout(function () { this.manager.manager.rejectChanges(); }, 1000);
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
                this.log(msg + reason, masterEntity, "Save changes", true);
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
            this.logError(msg, error);
            throw error;
        }

        public getStates(): ng.IPromise<any> {
            var states;

            var getSucceeded = (data) => {
                states = data.results;
                this.log("Retrieved [States] from remote data source", states.length, null, true);
                return states;
            }
            return this.EntityQuery.from("States")
                .using(this.manager.manager).execute()
                .then(getSucceeded)
                .catch(this.getFailed);

        }
        public getTideAndState(): ng.IPromise<ITideAndState> {
            return this.$q.all([this.getStates(), this.getTide()]).then( (dataArray) => {
                return <ITideAndState>{ states: dataArray[0], tide: dataArray[1] };
            });
        }
        public prime():void {
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
                    initial: { state: 'None', event: 'init',defer:true},
                    events: events
                });
                StateMachine.create({
                    target: this.manager.ModelItem.prototype,
                    initial: { state: 'None', event: 'init',defer:true },
                    events: events
                });
                this.log("States primed");
            }, (error) => {
                this.logError(error,null,Datacontext.serviceId,true);
            });
        }
    }

    // Register with angular
    app.factory(Datacontext.serviceId, ['common', EntityManagerFactory.serviceId, 'config', (common, entityManagerFactory, config) => new Datacontext(common, entityManagerFactory, config)]);

}
