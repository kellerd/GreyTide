/// <reference path="../scripts/linq-vsdoc.js" />
/// <reference path="../scripts/linq.min.js" />
/// <reference path="../scripts/angular.js" />
var app = angular.module('greyTideApp');

app.factory('tideService', ['$rootScope', 'greyTideContext', function ($rootScope, greyTideContext) {
    var storageMethod = localStorage;
    
    var service = {

        items: [],
        loading:false,
        RestoreState:  function () {
            if (!service.loading) {
                service.loading = true;
                greyTideContext.models.get(function (data) {
                    service.items = data;
                    service.loading = false;
                }, function (data, status, headers, config) {
                    service.loading = false;
                    alert(status + ":" + data);
                });
            }
        },
    }

    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);
