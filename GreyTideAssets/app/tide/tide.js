'use strict';
var App;
(function (App) {
    var Controllers;
    (function (Controllers) {
        var Tide = (function () {
            //#endregion
            function Tide(common, datacontext, $scope) {
                var _this = this;
                this.$scope = $scope;
                //#region Variables
                this.controllerId = Tide.controllerId;
                this.tide = [];
                this.criteriaMatch = function (item) {
                    var strCheck = function (str) {
                        return (_this.$scope.query1 == undefined || (str && str.indexOf(_this.$scope.query1) > -1)) && (_this.$scope.query2 == undefined || (str && str.indexOf(_this.$scope.query2) > -1));
                    };
                    return item.parent ||
                        ((_this.$scope.query5 || item.current != "Completed") &&
                            (strCheck(item.name) || strCheck(item.faction) || strCheck((item.points | 0).toString())) &&
                            (!_this.$scope.query3 || item.current.indexOf(_this.$scope.query3) > -1));
                };
                this.removeItem = function (item) {
                    var _that = _this;
                    if (item.entityAspect !== undefined) {
                        var index = _this.tide.indexOf(item);
                        item.entityAspect.setDeleted();
                        _this.tide.splice(index, 1);
                    }
                    else {
                        var parent_1 = item.complexAspect.parent;
                        var index = parent_1.items.indexOf(item);
                        parent_1.items.splice(index, 1);
                        _this.datacontext.saveEntity(parent_1).
                            then(function () { return _that.common.logger.logSuccess("Saved item", parent_1, "", true); }).
                            catch(function (reason) { return _that.common.logger.logError("Error saving item", parent_1, reason, true); });
                        ;
                    }
                };
                this.common = common;
                this.datacontext = datacontext;
                this.log = common.logger.log;
                // Queue all promises and wait for them to finish before loading the view
                this.activate([this.getTide(), this.getStates()]);
            }
            // TODO: is there a more elegant way of activating the controller - base class?
            Tide.prototype.activate = function (promises) {
                var _this = this;
                this.common.activateController(promises, this.controllerId)
                    .then(function () { _this.log('Activated Tide View'); });
            };
            //#region Public Methods
            Tide.prototype.getStates = function () {
                var _this = this;
                return this.datacontext.getStates().then(function (data) {
                    return _this.$scope.query3data = data[0].events.map(function (s) { return s.to; }).filter(function (item, i, ar) { return ar.indexOf(item) === i; }).sort();
                });
            };
            Tide.prototype.getTide = function () {
                var _this = this;
                return this.datacontext.getTide().then(function (data) {
                    return _this.tide = data;
                });
            };
            Tide.prototype.setActive = function (item, state) {
                item[state.name].call(item);
            };
            Tide.prototype.addItem = function (item) {
                if (item.items == this.tide) {
                    item.items.push(this.datacontext.create("Model", { "id": App.Services.GuidGenerator.newGuid(), "name": "--New Item--", "currentState": "Startup", "currentDate": new Date(Date.now()).toJSON(), "faction": "--choose faction--", "points": 0 }));
                }
                else {
                    item.items.push(this.datacontext.create("ModelItem", { "name": "--New Item--", "currentState": item.currentState, "currentDate": item.currentDate, "points": 0 }, true));
                }
                this.log("--New Item-- has been added");
            };
            Tide.controllerId = 'tide';
            return Tide;
        }());
        Controllers.Tide = Tide;
        // register controller with angular
        App.app.controller(Tide.controllerId, ['common', 'datacontext', '$scope',
            function (c, dc, scope) { return new App.Controllers.Tide(c, dc, scope); }
        ]);
    })(Controllers = App.Controllers || (App.Controllers = {}));
})(App || (App = {}));
//# sourceMappingURL=tide.js.map