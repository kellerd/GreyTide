/// <reference path="common/commonconfig.ts" />
module App {
    'use strict';
    import shared = App.Shared;

    export interface IEvents {
        controllerActivateSuccess: string;
        spinnerToggle: string;
        entitiesChanged: string;
        entitiesImported: string;
        hasChangesChanged: string;
        storage: IStorageSettings;
    }
    export interface IStorageSettings {
        error: string;
        storeChanged: string;
        wipChanged: string;
    }
    export interface IImageSettings {
        imageBasePath: string;
        unknownPersonImageSource: string;
    }

    export interface IConfigurations {
        appErrorPrefix: string;//Configure the exceptionHandler decorator
        docTitle: string;
        events: IEvents;
        remoteServiceName: string;
        version: string;
        imageSettings: IImageSettings;
        busyIndicator: string; // 2 options: spinner or overlay
    }

 
    // Configure Toastr
    toastr.options.timeOut = 4000;
    toastr.options.positionClass = 'toast-bottom-right';
    toastr.options.showMethod = 'slideDown';
    toastr.options.hideMethod = 'slideUp';

    export class KeyCodes {
       static backspace = 8;
       static tab = 9;
       static enter = 13;
       static esc = 27;
       static space = 32;
       static pageup = 33;
       static pagedown = 34;
       static end = 35;
       static home = 36;
       static left = 37;
       static up = 38;
       static right = 39;
       static down = 40;
       static insert = 45;
       static del = 46;
    };

    // For use with the HotTowel-Angular-Breeze add-on that uses Breeze
    var remoteServiceName = 'tide/v2';

    var events: IEvents = {
        controllerActivateSuccess: 'controller.activateSuccess',
        spinnerToggle: 'spinner.toggle',
        entitiesChanged: 'datacontext.entitiesChanged',
        entitiesImported: 'datacontext.entitiesImported',
        hasChangesChanged: 'datacontext.hasChangesChanged',
        storage: {
            error: 'store.error',
            storeChanged: 'store.changed',
            wipChanged: 'wip.changed'
        }
    };

    var config: IConfigurations = {
        appErrorPrefix: '[Tide Error] ', //Configure the exceptionHandler decorator
        busyIndicator: 'overlay', // 2 options: spinner or overlay
        docTitle: 'GreyTide: ',
        events: events,
        remoteServiceName: remoteServiceName,
        version: '0.3.0',
        imageSettings: {
            imageBasePath: '',
            unknownPersonImageSource: ''
        }
    };

    var app = angular.module('app');
    //Global variable for angular, should be static
    app.value('config', config);
    app.config(['$logProvider', $logProvider => {
        // turn debugging off/on (no info or warn)
        if ($logProvider.debugEnabled) {
            $logProvider.debugEnabled(true);
        }
    }]);
    //#region Configure the common services via commonConfig
    app.config(['commonConfigProvider', (cfg: shared.ICommonConfig) => {
        cfg.config.controllerActivateSuccessEvent = config.events.controllerActivateSuccess;
        cfg.config.spinnerToggleEvent = config.events.spinnerToggle;
    }]);
    //#endregion

    //#region Configure the Breeze Validation Directive
    app.config(['zDirectivesConfigProvider', function (cfg) {
        cfg.zValidateTemplate =
        '<span class="invalid"><i class="fa fa-warning-sign"></i>' +
        'Inconceivable! %error%</span>';
        //cfg.zRequiredTemplate =
        //    '<i class="fa fa-asterisk fa-asterisk-invalid z-required" title="Required"></i>';
    }]);

    // Learning Point:
    // Can configure during config or app.run phase
    //app.run(['zDirectivesConfig', function(cfg) {
    //    cfg.zValidateTemplate =
    //                 '<span class="invalid"><i class="fa fa-warning-sign"></i>' +
    //                 'Inconceivable! %error%</span>';
    //}]);
    //#endregion
}

 