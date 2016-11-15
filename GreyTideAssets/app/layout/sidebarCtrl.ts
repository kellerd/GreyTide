/// <reference path="../config.route.ts" />
/// <reference path="../app.ts" />
'use strict';
module App.Controllers
{


    export interface ISidebarCtrl
    {
        isCurrent(route: IAppRoute): string
        navRoutes: Array<Object>
    }

    export class SidebarCtrl implements ISidebarCtrl
    {
        public static controllerId:string = 'sidebarCtrl';
        navRoutes: Array<Object>;

        //using shortcut syntax on private variables in the constructor
        constructor(private $route, private config, private routes)
        {
            this.activate();
        }

        public isCurrent(route:IAppRoute)
        {
            if (!route.title || !this.$route.current || !this.$route.current.title)
            {
                return '';
            }
            var menuName = route.title;
            return this.$route.current.title.substr(0, menuName.length) === menuName ? 'current' : '';
        }
        public navClick()
        {
            
        }

        private activate()
        {
            this.getNavRoutes();
        }

        private getNavRoutes()
        {
            this.navRoutes = this.routes.filter((r:IAppRoute) => r.settings && r.settings.nav)
                .sort((r1: IAppRoute, r2: IAppRoute) => r1.settings.nav - r2.settings.nav);
        }
    }

    // Register with angular
    app.controller(
        SidebarCtrl.controllerId,
        ['$route', 'config', 'routes', ($r, c, r) => new SidebarCtrl($r, c, r)]);
}