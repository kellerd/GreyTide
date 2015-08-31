/// <reference path="../angular.js" />
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
                service.model = data;
                service.SaveState();
            }, function (error) { alert(error); });
        }
    }

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);