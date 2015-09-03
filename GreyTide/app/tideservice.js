/// <reference path="../scripts/linq-vsdoc.js" />
/// <reference path="../scripts/linq.min.js" />
/// <reference path="../scripts/angular.js" />
var app = angular.module('greyTideApp');

app.factory('tideService', ['$rootScope', '$http', 'stateService', 'responsivenessService','greyTideContext', function ($rootScope, $http, stateService, responsivenessService, greyTideContext) {
    var storageMethod = localStorage;
    StateMachine.create({
        target: Model.prototype,
        initial: { state: 'None', event: 'init', defer: true },
        events: stateService.model[0].events
    });
    var items = function (model) {
        return Enumerable.From(model).Select(function (x) {
            return {
                'name': x.name,
                'points': x.points,
                'states': Enumerable.From(x.states).Where(function (x) { return x.active }).Select(function (y) {
                    return {
                        'name': y.name, 'date': y.date
                    };
                }).ToArray(),
                'items': items(x.items)
            }
            }).ToArray();
        };
    var service = {

        items: [],
        loading: false,
        SaveState: function () {
            if (!service.loading && service.items.length > 0) {
                storageMethod.tideService = Enumerable.From(service.items).Select(function (x) {
                    return {
                        'name': x.name,
                        'points': x.points,
                        'faction': x.faction,
                        'states': Enumerable.From(x.states).Where(function (x) { return x.active }).Select(function (y) {
                            return {
                                'name': y.name, 'date': y.date
                            };
                        }).ToArray(),
                        'items': items(x.items)
                    };
                }).ToJSON(ModelReplacer);
            }
        },

        RestoreState: function () {
            if (!service.loading) {
                if (storageMethod.tideService) {
                    service.loading = true;
                    service.LoadFromJson(angular.fromJson(storageMethod.tideService));
                    service.loading = false;
                } else
                    service.Refresh();
            }
        },
        LoadFromJson: function (data) {
            service.items = [];
             responsivenessService.responsiveMap(data, function (model) {
                return new Model(model, service);
             }).then(function (data) {
                 service.items.push.apply(service.items, data);
                 service.loading = false;
                 service.SaveState();
             });


        },
        Refresh: function () {
            if (!service.loading) {
                greyTideContext.models.get(function (data) {
                    service.LoadFromJson(data);
                }, function (data, status, headers, config) {
                    service.loading = false;
                    alert(status + ":" + data);
                });
            }
        },
        LastState: function (item) {
            var maxDateMili = Enumerable.From(item.states).Where(function (x) {
                return x.active;
            }).Max(function (x) {
                return Date.parse(x.date);
            });
            return new Date(maxDateMili).toLocaleDateString();
        }
    }

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);
