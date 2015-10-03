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
            routes.forEach(r => {
                $routeProvider.when(r.url, r.config);
            });
            $routeProvider.otherwise({ redirectTo: '/' });
        }

    }

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
                    templateUrl: 'appTypeScript/tide/tide.html'

                }
            }, {
                title: 'state',
                url: '/state',
                settings: {
                    nav: 2,
                    content: '<i class="fa fa-lock"></i> States'
                },
                config: {
                    templateUrl: 'appTypeScript/state/state.html'
                   
                }
            },  {
                title: 'chart',
                url: '/chart',
                settings: {
                    nav: 4,
                    content: '<i class="fa fa-lock"></i> Chart'
                },
                config: {
                    templateUrl: 'appTypeScript/chart/chart.html'                  
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