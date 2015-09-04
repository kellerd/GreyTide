/// <reference path="../scripts/angular.js" />
/// <reference path="greyTideContext.js" />
var app = angular.module('greyTideApp');


app.factory('stateService', ['$rootScope', '$http', 'greyTideContext', function ($rootScope, $http, greyTideContext) {
    var storageMethod = localStorage;
    var service = {

        model: [
            {
                name: "",
                events: [
                    { name: "", from: "", to: "" }
                ]
            }
        ],

        SaveState: function () {
            storageMethod.stateService = angular.toJson(service.model);
        },

        RestoreState: function () {
            if (storageMethod.stateService)
                service.model = angular.fromJson(storageMethod.stateService);
            if (service.model.length == 0 || service.model[0].name == "")
                service.Refresh();
        },
        Refresh: function () {
            greyTideContext.states.get(function (data) {
                service.model = data.map(function (d) {
                    return {

                        name: d.name,
                        events: d.events.map(function (e) {
                            return {
                                name: e.name,
                                from: e.from.map(function (f) { return f.name; }),
                                to: e.to
                            }
                        })
                    }
                });
                service.SaveState();
            }, function (error) {
                alert(error);
            });
        }
    }

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);