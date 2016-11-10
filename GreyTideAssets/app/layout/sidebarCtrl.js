'use strict';
var App;
(function (App) {
    var Controllers;
    (function (Controllers) {
        var SidebarCtrl = (function () {
            //using shortcut syntax on private variables in the constructor
            function SidebarCtrl($route, config, routes) {
                this.$route = $route;
                this.config = config;
                this.routes = routes;
                this.activate();
            }
            SidebarCtrl.prototype.isCurrent = function (route) {
                if (!route.title || !this.$route.current || !this.$route.current.title) {
                    return '';
                }
                var menuName = route.title;
                return this.$route.current.title.substr(0, menuName.length) === menuName ? 'current' : '';
            };
            SidebarCtrl.prototype.navClick = function () {
            };
            SidebarCtrl.prototype.activate = function () {
                this.getNavRoutes();
            };
            SidebarCtrl.prototype.getNavRoutes = function () {
                this.navRoutes = this.routes.filter(function (r) { return r.settings && r.settings.nav; })
                    .sort(function (r1, r2) { return r1.settings.nav - r2.settings.nav; });
            };
            SidebarCtrl.controllerId = 'sidebarCtrl';
            return SidebarCtrl;
        }());
        Controllers.SidebarCtrl = SidebarCtrl;
        // Register with angular
        App.app.controller(SidebarCtrl.controllerId, ['$route', 'config', 'routes', function ($r, c, r) { return new SidebarCtrl($r, c, r); }]);
    })(Controllers = App.Controllers || (App.Controllers = {}));
})(App || (App = {}));
//# sourceMappingURL=sidebarCtrl.js.map