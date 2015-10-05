'use strict';
module App.Controllers {
    export class Tide {
        public static controllerId: string = 'tide';
        //#region Variables
        controllerId = Tide.controllerId;
        common: App.Shared.ICommon;
        datacontext: App.Services.IDatacontext;
        log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        messageCount: number;
        tide: Array<any> = [];
        orderProp: string;
        //#endregion
        constructor(common: App.Shared.ICommon, datacontext: App.Services.IDatacontext, private $scope) {
            this.common = common;
            this.datacontext = datacontext;
            this.log = common.logger.log;

            // Queue all promises and wait for them to finish before loading the view
            this.activate([this.getTide(), this.getStates()]);
        }

        // TODO: is there a more elegant way of activating the controller - base class?
        activate(promises: Array<ng.IPromise<any>>) {
            this.common.activateController(promises, this.controllerId)
                .then(() => { this.log('Activated Tide View'); });
        }
        criteriaMatch = (item) => {
            return true;
            var strCheck = (str) => {
                return (this.$scope.query1 == undefined || (str && str.indexOf(this.$scope.query1) > -1)) && (this.$scope.query2 == undefined || (str && str.indexOf(this.$scope.query2) > -1));
            }
            return item.parent ||
                (
                    (this.$scope.query5 || item.current != "Completed") &&
                    (strCheck(item.name) || strCheck(item.faction) || strCheck((item.points | 0).toString())) &&
                    (!this.$scope.query3 || item.current.indexOf(this.$scope.query3) > -1)
                );
        };
        //#region Public Methods
        getStates() {
            return this.datacontext.getStates().then((data: any) => {
                return this.$scope.query3data = data[0].events.map((s) => s.to).filter(function (item, i, ar) { return ar.indexOf(item) === i; }).sort();
            });
        }
        getTide() {
            return this.datacontext.getTide().then(data => {
                return this.tide = data;
            });
        }

        //#endregion
    }

    // register controller with angular
    app.controller(Tide.controllerId, ['common', 'datacontext', '$scope',
        (c, dc, scope) => new App.Controllers.Tide(c, dc, scope)
    ]);
}