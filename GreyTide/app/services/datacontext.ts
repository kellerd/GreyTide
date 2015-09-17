/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />

module App.Services {

    export interface IDatacontext {
        getTideAndState(): ng.IPromise<ITideAndState>;
        getTide(): ng.IPromise<Array<any>>;
    }
    
    export interface ITideAndState {
        states: any;
        tide: any;
    }

    export class Datacontext {
        public static serviceId: string = 'datacontext';
        private common: any;
        private $q: ng.IQService;


        constructor(common) {
            this.common = common;
            this.$q = common.$q;
        }
        public getTide(): ng.IPromise<any> {
            var tide=[name=""];
            return this.$q.when(tide);
        }
        public getTideAndState(): ng.IPromise<ITideAndState> {
            var TideAndState: ITideAndState =  {
                states : [],
                tide : []};
            
            return this.$q.when(TideAndState);
        }
    }

    // Register with angular
    app.factory(Datacontext.serviceId, ['common', (common) => new Datacontext(common)]);

}
