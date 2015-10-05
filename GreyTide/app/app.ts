'use strict';
module App {

    export var app = angular.module('app', [
    // Angular modules 
        'ngAnimate',        // animations
        'ngRoute',          // routing
        'ngSanitize',       // sanitizes html bindings (ex: sidebarCtrl.js)

    // Custom modules 
        'common',           // common functions, logger, spinner
        'common.bootstrap', // bootstrap dialog wrapper functions

    // 3rd Party Modules
        'breeze.angular',    // configures breeze for an angular app
        'breeze.directives', // contains the breeze validation directive (zValidate)
        'ui.bootstrap',       // ui-bootstrap (ex: carousel, pagination, dialog)
        'xeditable'         //editable items in tide
    ]);
    
    // Handle routing errors and success events
    app.run(['$route', 'datacontext', 'editableOptions', function ($route, datacontext: App.Services.IDatacontext, editableOptions) {
        // Include $route to kick start the router.
        datacontext.prime();
        editableOptions.theme = 'bs3';
    }]);

}