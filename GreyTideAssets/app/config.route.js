/// <reference path="../scripts/typings/angularjs/angular.d.ts" />
'use strict';
var App;
(function (App) {
    var RouteConfigurator = (function () {
        function RouteConfigurator($routeProvider, routes, $locationProvider) {
            routes.forEach(function (r) {
                $routeProvider.when(r.url, r.config);
            });
            $routeProvider.otherwise({ redirectTo: '/' });
        }
        return RouteConfigurator;
    }());
    App.RouteConfigurator = RouteConfigurator;
    // Define the routes - since this goes right to an app.constant, no use for a class
    // Could make it a static property of the RouteConfigurator class
    function getRoutes() {
        return [
            {
                title: 'tide',
                url: '/',
                settings: {
                    nav: 1,
                    content: '<i class="fa fa-lock"></i> Grey Tide'
                },
                config: {
                    templateUrl: 'app/tide/tide.html'
                }
            }, {
                title: 'state',
                url: '/state',
                settings: {
                    nav: 2,
                    content: '<i class="fa fa-lock"></i> States'
                },
                config: {
                    templateUrl: 'app/state/state.html'
                }
            }, {
                title: 'chart',
                url: '/chart',
                settings: {
                    nav: 4,
                    content: '<i class="fa fa-lock"></i> Chart'
                },
                config: {
                    templateUrl: 'app/chart/chart.html'
                }
            }
        ];
    }
    // Collect the routes
    App.app.constant('routes', getRoutes());
    // Configure the routes and route resolvers
    App.app.config([
        '$routeProvider', 'routes', '$locationProvider',
        function ($routeProvider, routes, $locationProvider) {
            return new RouteConfigurator($routeProvider, routes, $locationProvider);
        }
    ]);
})(App || (App = {}));
//# sourceMappingURL=config.route.js.map