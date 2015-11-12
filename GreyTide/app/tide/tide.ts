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
        constructor(common: App.Shared.ICommon, datacontext: App.Services.IDatacontext, private $scope:ng.IScope) {
            this.common = common;
            this.datacontext = datacontext;
            this.log = common.logger.log;

            // Queue all promises and wait for them to finish before loading the view
            this.activate([this.getTide(), this.getStates()]);
        }

        // TODO: is there a more elegant way of activating the controller - base class?
        activate(promises: Array<ng.IPromise<any>>) {
            this.onDestroy();
            this.onHasChanges();
            this.common.activateController(promises, this.controllerId)
                .then(() => { this.log('Activated Tide View'); })
                .then(this.onEveryChange);
        }

        onEveryChange() {
            this.$scope.$on(this.common.commonConfig.events.entitiesChanged, (event, data) => { this.autoStoreWip(data,false); });
        }

        onDestroy() {
            this.$scope.$on('$destroy', () => {
                this.autoStoreWip(null,true);
                this.datacontext.cancel();
            });
        }

        hasChanges = false;
        onHasChanges() {
            this.$scope.$on(this.common.commonConfig.events.hasChangesChanged,
                (event, data) => { this.hasChanges = data.hasChanges; });
        }

        autoStoreWip(data, immediate: boolean) {
            let _that = this;
            let entity = data.entity;
            this.datacontext.saveEntity(entity).
                then(function () { return _that.common.logger.logSuccess("Saved item", entity, "", true); }).
                catch(function (reason) { return _that.common.logger.logError("Error saving item", entity, reason, true); });
            //common.debouncedThrottle(controllerId, storeWipEntity, 1000, immediate);
        }







        criteriaMatch = (item) => {
            var strCheck = (str) => {
                return ((<any>this.$scope).query1 == undefined || (str && str.indexOf((<any>this.$scope).query1) > -1)) && ((<any>this.$scope).query2 == undefined || (str && str.indexOf((<any>this.$scope).query2) > -1));
            }
            return item.parent ||
                (
                    ((<any>this.$scope).query5 || item.current != "Completed") &&
                    (strCheck(item.name) || strCheck(item.faction) || strCheck((item.points | 0).toString())) &&
                    (!(<any>this.$scope).query3 || item.current.indexOf((<any>this.$scope).query3) > -1)
                );
        };

        //#region Public Methods
        getStates() {
            return this.datacontext.getStates().then((data: any) => {
                return (<any>this.$scope).query3data = data[0].events.map((s) => s.to).filter(function (item, i, ar) { return ar.indexOf(item) === i; }).sort();
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
                item.items.push(this.datacontext.create("Model", { "id": breeze.core.getUuid(), "name": "--New Item--","currentState":"Startup", "currentDate":new Date(Date.now()).toJSON(), "faction": "--choose faction--", "points": 0 }));
            }
            else {
                item.items.push(this.datacontext.create("ModelItem", { "name": "--New Item--", "currentState": item.currentState, "currentDate": item.currentDate,"points": 0 }, true));
            }
            this.log("--New Item-- has been added");
        }
        removeItem = (item) => {
            let _that = this;
            if (item.entityAspect !== undefined) {
                let index = this.tide.indexOf(item);
                item.entityAspect.setDeleted();
                this.tide.splice(index, 1);
            } else {
                let parent = item.complexAspect.parent;
                let index = parent.items.indexOf(item);
                parent.items.splice(index, 1);
                this.datacontext.saveEntity(parent).
                    then(function () { return _that.common.logger.logSuccess("Saved item", parent, "", true); }).
                    catch(function (reason) { return _that.common.logger.logError("Error saving item", parent, reason, true); });;
            }
        }
        //#endregion
    }

    // register controller with angular
    app.controller(Tide.controllerId, ['common', 'datacontext', '$scope',
        (c, dc, scope) => new App.Controllers.Tide(c, dc, scope)
    ]);
}