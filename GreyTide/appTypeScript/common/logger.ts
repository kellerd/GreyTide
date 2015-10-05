/// <reference path="common.ts" />
'use strict';
module App.Shared{

    export interface ILogger {
        log(message: string, data: any, source: string, showToast: boolean)
        logError(message: string, data: any, source: string, showToast: boolean)
        logSuccess(message: string, data: any, source: string, showToast: boolean)
        logWarning(message: string, data: any, source: string, showToast: boolean)
    }
    

    export class Logger implements ILogger{
        public static serviceId = 'logger';
        //#region Variables
        $log;
        logFn:Function;
        service = {
        log: this.log,
        logError: this.logError,
        logSuccess: this.logSuccess,
        logWarning: this.logWarning
        };
        //#endregion
        
        constructor($log)
        {
            this.$log = $log;
        }
        //#region Public Methods
        

        public log = (message: string, data: any, source: string, showToast: boolean) =>
        {
            this.logIt(message, data, source, showToast, 'info');
        }

        public logWarning = (message: string, data: any, source: string, showToast: boolean) =>
        {
            this.logIt(message, data, source, showToast, 'warning');
        }

        public logSuccess = (message: string, data: any, source: string, showToast: boolean) =>
        {
            this.logIt(message, data, source, showToast, 'success');
        }

        public logError = (message: string, data: any, source: string, showToast: boolean) =>
        {
            this.logIt(message, data, source, showToast, 'error');
        }

        //#endregion
        private logIt=(message:string, data:any, source:string, showToast:any, toastType:string) => {
            var write = (toastType === 'error') ? this.$log.error : this.$log.log;
            source = source ? '[' + source + '] ' : '';
            write(source, message, data);
            if (showToast) {
                if (toastType === 'error') {
                    toastr.error(message);
                } else if (toastType === 'warning') {
                    toastr.warning(message);
                } else if (toastType === 'success') {
                    toastr.success(message);
                } else {
                    toastr.info(message);
                }
            }
        }

    }

    // Register with angular
    commonModule.factory(Logger.serviceId, ['$log', ($log) => new Logger($log)]);
}