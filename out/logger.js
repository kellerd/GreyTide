/// <reference path="common.ts" />
'use strict';
var App;
(function (App) {
    var Shared;
    (function (Shared) {
        var Logger = (function () {
            //#endregion
            function Logger($log) {
                var _this = this;
                this.service = {
                    log: this.log,
                    logError: this.logError,
                    logSuccess: this.logSuccess,
                    logWarning: this.logWarning
                };
                //#region Public Methods
                this.log = function (message, data, source, showToast) {
                    _this.logIt(message, data, source, showToast, 'info');
                };
                this.logWarning = function (message, data, source, showToast) {
                    _this.logIt(message, data, source, showToast, 'warning');
                };
                this.logSuccess = function (message, data, source, showToast) {
                    _this.logIt(message, data, source, showToast, 'success');
                };
                this.logError = function (message, data, source, showToast) {
                    _this.logIt(message, data, source, showToast, 'error');
                };
                //#endregion
                this.logIt = function (message, data, source, showToast, toastType) {
                    var write = (toastType === 'error') ? _this.$log.error : _this.$log.log;
                    source = source ? '[' + source + '] ' : '';
                    write(source, message, data);
                    if (showToast) {
                        if (toastType === 'error') {
                            toastr.error(message);
                        }
                        else if (toastType === 'warning') {
                            toastr.warning(message);
                        }
                        else if (toastType === 'success') {
                            toastr.success(message);
                        }
                        else {
                            toastr.info(message);
                        }
                    }
                };
                this.$log = $log;
            }
            Logger.serviceId = 'logger';
            return Logger;
        }());
        Shared.Logger = Logger;
        // Register with angular
        commonModule.factory(Logger.serviceId, ['$log', function ($log) { return new Logger($log); }]);
    })(Shared = App.Shared || (App.Shared = {}));
})(App || (App = {}));
