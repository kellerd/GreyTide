/// <reference path="../scripts/typings/angularjs/angular.d.ts" />
'use strict';
module App
{
    export interface IAppRoute
    {
        url: string;
        config: ng.route.IRoute;
    }


    export class RouteConfigurator
    {
        constructor($routeProvider: ng.route.IRouteProvider, routes)
        {
            routes.forEach(r =>
            {
                $routeProvider.when(r.url, r.config);
            });
            $routeProvider.otherwise({ redirectTo: '/' });
        }
        
    }

    // Define the routes - since this goes right to an app.constant, no use for a class
    // Could make it a static property of the RouteConfigurator class
    function getRoutes(): IAppRoute[]
    {
        return [
            {
                url: '/',
                config: {
                    templateUrl: 'app/dashboard/dashboard.html',
                    title: 'dashboard',
                    settings: {
                        nav: 1,
                        content: '<i class="fa fa-dashboard"></i> Dashboard'
                    }
                }
            }, {
                url: '/state',
                config: {
                    title: 'state',
                    templateUrl: 'app/state/state.html',
                    settings: {
                        nav: 2,
                        content: '<i class="fa fa-lock"></i> States'
                    }
                }
            }, {
                url: '/tide',
                config: {
                    title: 'tide',
                    templateUrl: 'app/tide/tide.html',
                    settings: {
                        nav: 3,
                        content: '<i class="fa fa-lock"></i> Grey Tide'
                    }
                }
            }, {
                url: '/chart',
                config: {
                    title: 'chart',
                    templateUrl: 'app/chart/chart.html',
                    settings: {
                        nav: 3,
                        content: '<i class="fa fa-lock"></i> Chart'
                    }
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