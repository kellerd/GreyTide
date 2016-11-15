'use strict';
var App;
(function (App) {
    var Controllers;
    (function (Controllers) {
        var State = (function () {
            //#endregion
            function State(common, datacontext) {
                //#region Variables
                this.controllerId = State.controllerId;
                this.states = [];
                this.common = common;
                this.datacontext = datacontext;
                this.log = common.logger.log;
                // Queue all promises and wait for them to finish before loading the view
                this.activate([this.getState()]);
            }
            // TODO: is there a more elegant way of activating the controller - base class?
            State.prototype.activate = function (promises) {
                var _this = this;
                this.common.activateController(promises, this.controllerId)
                    .then(function () { _this.log('Activated State View'); });
            };
            //#region Public Methods
            State.prototype.getState = function () {
                var _this = this;
                return this.datacontext.getStates().then(function (data) {
                    return _this.states = data;
                });
            };
            State.controllerId = 'state';
            return State;
        }());
        Controllers.State = State;
        // register controller with angular
        app.controller(State.controllerId, ['common', 'datacontext',
            function (c, dc) { return new App.Controllers.State(c, dc); }
        ]);
    })(Controllers = App.Controllers || (App.Controllers = {}));
})(App || (App = {}));
