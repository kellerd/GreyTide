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
        setActive(item, state) {
            item[state.name].call(item);
        }
        addItem(item) {
            if (item.items == this.tide) {
                item.items.push(this.datacontext.create("Model", { "id": App.Services.GuidGenerator.newGuid(), "name": "--New Item--","currentState":"Startup", "currentDate":new Date(Date.now()).toJSON(), "faction": "--choose faction--", "points": 0 }));
            }
            else {
                item.items.push(this.datacontext.create("ModelItem", { "name": "--New Item--", "currentState": item.currentState, "currentDate": item.currentDate,"points": 0 }, true));
            }
            this.log("--New Item-- has been added");
        }
        removeItem = (item) => {
            if (item.entityAspect !== undefined) {
                let index = this.tide.indexOf(item);
                item.entityAspect.setDeleted();
                this.tide.splice(index);
            } else {
                let index = item.complexAspect.parent.items.indexOf(item);
                item.complexAspect.parent.items.splice(index);
            }
        }
        //#endregion
    }

    // register controller with angular
    app.controller(Tide.controllerId, ['common', 'datacontext', '$scope',
        (c, dc, scope) => new App.Controllers.Tide(c, dc, scope)
    ]);
}