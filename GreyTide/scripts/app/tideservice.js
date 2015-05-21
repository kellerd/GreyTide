/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="../angular.js" />
var app = angular.module('greyTideApp');

app.factory('tideService', ['$rootScope', '$http', 'stateService', function ($rootScope, $http, stateService) {
    var storageMethod = localStorage;
    StateMachine.create({
        target: ModelObject.prototype,
        initial: { state: 'None', event: 'init', defer: true },
        events: stateService.model[0].events
    });
    var pieces = function(model) {
        return Enumerable.From(model).Select(function (x) {
            return {
                'name': x.name,
                'points': x.points,
                'States': Enumerable.From(x.States).Where(function (x) { return x.active }).Select(function (y) {
                    return {
                        'name': y.name, 'date': y.date
                    };
                }).ToArray(),
                'Pieces': pieces(x.Pieces)
            }
            }).ToArray();
        };
    var service = {

        model: [],
        loading: false,
        SaveState: function () {
            if (!service.loading && service.model.length > 0) {
                storageMethod.tideService = Enumerable.From(service.model).Select(function (x) {
                    return {
                        'name': x.name,
                        'points': x.points,
                        'faction': x.faction,
                        'States': Enumerable.From(x.States).Where(function (x) { return x.active }).Select(function (y) {
                            return {
                                'name': y.name, 'date': y.date
                            };
                        }).ToArray(),
                        'Pieces': pieces(x.Pieces)
                    };
                }).ToJSON(ModelObjectReplacer);
            }
        },

        RestoreState: function () {
            if (!service.loading) {
                if (storageMethod.tideService) {
                    service.loading = true;
                    service.LoadFromJson(angular.fromJson(storageMethod.tideService));
                    service.loading = false;
                }
                if (service.model.length == 0 || service.model[0].name == "")
                    service.Refresh();
            }
        },
        LoadFromFile: function (file) {
            $http.get(file, { cache: false }).
               success(function (data) {
                   service.LoadFromJson(data);
               }).
               error(function (data, status, headers, config) {
                   service.loading = false;
                   alert(status + ":" + data);
               });
        },
        LoadFromJson: function (data) {
            service.model = []
            Enumerable.From(data).Select(function (x) { return new ModelObject(x, service) }).ForEach(function (x) {
                service.model.push(x);
            });
            service.loading = false;
            service.SaveState();
        },
        Refresh: function () {
            if (!service.loading) {
                service.loading = true;
                service.LoadFromFile('data/models.json');
            }
        },
        LastState: function (item) {
            var maxDateMili = Enumerable.From(item.States).Where(function (x) { return x.active; }).Max(function (x) { return Date.parse(x.date); });
            return new Date(maxDateMili).toLocaleDateString();
        }
    }

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);
