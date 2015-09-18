/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />

module App.Services {

    export interface IDatacontext {
        getTideAndState(): ng.IPromise<ITideAndState>;
        getTide(): ng.IPromise<any>;
        getStates(): ng.IPromise<any>;
        prime(): Function;
    }

    export interface ITideAndState {
        states: any;
        tide: any;
    }

    export class Datacontext {
        public static serviceId: string = 'datacontext';
        private common: App.Shared.ICommon;
        private $q: ng.IQService;

        private getLogFn: (moduleId: string, fnName?: string)=>any;
        private logError: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        private logSuccess: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        private log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        private EntityQuery: typeof breeze.EntityQuery;
        private manager: breeze.EntityManager;
        private config: IConfigurations;

        constructor(common: App.Shared.ICommon, emFactory: IEntityManagerFactory, config:IConfigurations) {
            this.common = common;
            this.$q = common.$q;
            this.getLogFn = common.logger.getLogFn;
            this.log = this.getLogFn(Datacontext.serviceId);
            this.logError = this.getLogFn(Datacontext.serviceId, 'error');
            this.logSuccess = this.getLogFn(Datacontext.serviceId, 'success');
            this.EntityQuery = breeze.EntityQuery;
            this.manager = emFactory.newManager();
            this.config = config;
        }
        public getTide(): ng.IPromise<any> {
            var tide;
            return this.EntityQuery.from("Tide").expand("states,items")
                .using(this.manager).execute()
                .then(getSucceeded)
                .catch(this.getFailed);

            function getSucceeded(data) {
                tide = data.results;
                this.log("Retrieved [Tide] from remote data source", tide.length, true);
                return tide;
            }
        }

        private getFailed(error) {
            var msg = this.config.appErrorPrefix + "Error retrieving states: " + error.message;
            this.logError(msg, error);
            throw error;
        }

        public getStates(): ng.IPromise<any> {
            var states;
            return this.EntityQuery.from("States").expand("events.from")
                .using(this.manager).execute()
                .then(getSucceeded)
                .catch(this.getFailed);

            function getSucceeded(data) {
                states = data.results;
                this.log("Retrieved [States] from remote data source", states.length, true);
                return states;
            }
        }
        public getTideAndState(): ng.IPromise<ITideAndState> {
            return this.$q.all([this.getStates(), this.getTide()]).then(function (dataArray) {
                return <ITideAndState>{ states: dataArray[0], tide: dataArray[1] };
            });
        }
        public prime():void {
            
        }
    }

    // Register with angular
    app.factory(Datacontext.serviceId, ['common', 'emFactory', 'config', (common, emFactory, config) => new Datacontext(common, emFactory, config)]);

}
