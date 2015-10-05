/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../scripts/typings/statemachine/statemachine.d.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />
module App.Services {

    export interface IDatacontext {
        getTideAndState(): ng.IPromise<ITideAndState>;
        getTide(): ng.IPromise<any>;
        getStates(): ng.IPromise<any>;
        prime(): Function;
        create(localModelName: string, initialValues?: {}, entityState?: breeze.EntityStateSymbol, mergeStrategy?: breeze.MergeStrategySymbol) : breeze.Entity
    }

    export interface ITideAndState {
        states: any;
        tide: any;
    }

    export class Datacontext {
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
            this.manager = entityManagerFactory.newManager();
        }
        create(localModelName: string, initialValues?: {}, entityState?: breeze.EntityStateSymbol, mergeStrategy?: breeze.MergeStrategySymbol): breeze.Entity {
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
                        from: e.from.map(function (f) { return f.name; }),
                        to: e.to
                    }
                });
                StateMachine.create({
                    target: this.manager.Model.prototype,
                    initial: { state: 'None', event: 'init', defer: true },
                    events: events
                });
                this.log("States primed");
            }, (error) => {
                this.logError(error,null,Datacontext.serviceId,true);
            });
        }
    }

    // Register with angular
    app.factory(Datacontext.serviceId, ['common', 'entityManagerFactory', 'config', (common, entityManagerFactory, config) => new Datacontext(common, entityManagerFactory, config)]);

}
