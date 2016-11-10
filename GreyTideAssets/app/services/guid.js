/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />
var App;
(function (App) {
    var Services;
    (function (Services) {
        var GuidGenerator;
        (function (GuidGenerator) {
            function newGuid() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                    s4() + '-' + s4() + s4() + s4();
            }
            GuidGenerator.newGuid = newGuid;
        })(GuidGenerator = Services.GuidGenerator || (Services.GuidGenerator = {}));
    })(Services = App.Services || (App.Services = {}));
})(App || (App = {}));
//# sourceMappingURL=guid.js.map