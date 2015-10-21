/// <reference path="../scripts/typings/angularjs/angular.d.ts" />
'use strict';
module App {
    export interface IRouteSetting {
        nav: number;
        content: string;
    }
    export interface IAppRoute {
        title: string;
        url: string;
        settings: IRouteSetting;
        config: ng.route.IRoute;

    }


    export class RouteConfigurator {
        constructor($routeProvider: ng.route.IRouteProvider, routes) {
            //#region testing
            // Learning Point:
            // If we are testing, we do NOT want to se the routes. 
            // We did this to prevent the route changes from happening during tests
            if ((<any>window).testing) return;
            // some tests fail if this is EVER executed during ANY test in the run
            //#endregion
            routes.forEach(r => {
                setRoute(r.url, r.config);
            });
            $routeProvider.otherwise({ redirectTo: '/' });
            function setRoute(url, definition) {
                // Sets resolvers for all of the routes
                // 1. Anything you need to do prior to going to a new route
                // 2. Any logic that might prevent the new route ($q.reject)
                definition.resolve = angular.extend(definition.resolve || {}, {
                    prime: prime //Learning Point: do not prime as a test
                });
                $routeProvider.when(url, definition);

                return $routeProvider;
            }
        }

    }
    // prime the core data for the app
    prime.$inject = ['datacontext'];
    function prime(dc:App.Services.IDatacontext) { return dc.prime(); }

    // Define the routes - since this goes right to an app.constant, no use for a class
    // Could make it a static property of the RouteConfigurator class
    function getRoutes(): IAppRoute[] {
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
            },  {
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
    app.constant('routes', getRoutes());

    // Configure the routes and route resolvers
    app.config([
        '$routeProvider', 'routes',
        ($routeProvider, routes) =>
            new RouteConfigurator($routeProvider, routes)
    ]);

}