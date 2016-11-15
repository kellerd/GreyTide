/// <reference path="common/commonconfig.ts" />
var App;
(function (App) {
    'use strict';
    // Configure Toastr
    toastr.options.timeOut = 4000;
    toastr.options.positionClass = 'toast-bottom-right';
    // For use with the HotTowel-Angular-Breeze add-on that uses Breeze
    var remoteServiceName = 'tide/v2';
    var events = {
        controllerActivateSuccess: 'controller.activateSuccess',
        spinnerToggle: 'spinner.toggle'
    };
    var config = {
        appErrorPrefix: '[Tide Error] ',
        docTitle: 'GreyTide: ',
        events: events,
        remoteServiceName: remoteServiceName,
        version: '0.2.0',
        imageSettings: {
            imageBasePath: '',
            unknownPersonImageSource: ''
        }
    };
    var app = angular.module('app');
    //Global variable for angular, should be static
    app.value('config', config);
    app.config(['$logProvider', function ($logProvider) {
            // turn debugging off/on (no info or warn)
            if ($logProvider.debugEnabled) {
                $logProvider.debugEnabled(true);
            }
        }]);
    //#region Configure the common services via commonConfig
    app.config(['commonConfigProvider', function (cfg) {
            cfg.config.controllerActivateSuccessEvent = config.events.controllerActivateSuccess;
            cfg.config.spinnerToggleEvent = config.events.spinnerToggle;
        }]);
})(App || (App = {}));
