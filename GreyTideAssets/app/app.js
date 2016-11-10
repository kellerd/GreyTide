'use strict';
var App;
(function (App) {
    App.app = angular.module('app', [
        // Angular modules 
        'ngAnimate',
        'ngRoute',
        'ngSanitize',
        // Custom modules 
        'common',
        'common.bootstrap',
        // 3rd Party Modules
        'breeze.angular',
        'breeze.directives',
        'ui.bootstrap',
        'xeditable' //editable items in tide
    ]);
    // Handle routing errors and success events
    App.app.run(['$route', 'datacontext', 'editableOptions', function ($route, datacontext, editableOptions) {
            // Include $route to kick start the router.
            datacontext.prime();
            editableOptions.theme = 'bs3';
        }]);
})(App || (App = {}));
//# sourceMappingURL=app.js.map