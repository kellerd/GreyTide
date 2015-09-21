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
        query1: string;
        query2: string;
        query3: string;
        query5: Array<any>;
        orderProp: string;
        //#endregion
        constructor(common: App.Shared.ICommon, datacontext: App.Services.IDatacontext) {
            this.common = common;
            this.datacontext = datacontext;
            this.log = common.logger.log;

            // Queue all promises and wait for them to finish before loading the view
            this.activate([this.getTide()]);
        }

        // TODO: is there a more elegant way of activating the controller - base class?
        activate(promises: Array<ng.IPromise<any>>) {
            this.common.activateController(promises, this.controllerId)
                .then(() => { this.log('Activated Tide View'); });
        }
        criteriaMatch = () => {
            var localThis = this;
            var strCheck = (str) => {
                return (localThis.query1 == undefined || (str && str.indexOf(localThis.query1) > -1)) && (localThis.query2 == undefined || (str && str.indexOf(localThis.query2) > -1));
            }
            return (item) => {
                return item.parent ||
                    (
                        (this.query5 || item.current != "Completed") &&
                        (strCheck(item.name) || strCheck(item.faction) || strCheck((item.points | 0).toString())) &&
                        (!this.query3 || item.current.indexOf(this.query3) > -1)
                    );
            };
        };

        //#region Public Methods
        getStates() {
            return this.datacontext.getStates().then((data: any) => {
                return this.query5 = data.map((s) => s.name);
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
    app.controller(Tide.controllerId, ['common', 'datacontext',
        (c, dc) => new App.Controllers.Tide(c, dc)
    ]);
}