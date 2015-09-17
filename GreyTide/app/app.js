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
        'ui.bootstrap' // ui-bootstrap (ex: carousel, pagination, dialog)
    ]);
    // Handle routing errors and success events
    App.app.run(['$route', function ($route) {
            // Include $route to kick start the router.
        }]);
})(App || (App = {}));
//# sourceMappingURL=app.js.map