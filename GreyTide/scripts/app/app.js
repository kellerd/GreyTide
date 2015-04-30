/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="../angular.js" />
/// <reference path="../angular-route.js" />
/// <reference path="../jqPlot/jquery.jqplot.js" />
/// <reference path="contollers.js" />
var app = angular.module('greyTideApp', ['ngRoute',
  'GreyTideControllers', 'multi-select']);

app.directive('chartbar', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, el, attrs) {

            angular.element(document).ready(function () {

                var model = Enumerable.From(scope.Tide.model);
                var groups = model.GroupBy(function (data) { return data.faction });
                var raw = groups.Select(function (model) {
                    return {
                        Faction: model.Key(),
                        List: Enumerable.From(model).Select(function (singlemodel) {
                            return {
                                state: singlemodel.current,
                                points: singlemodel.points,
                                name: singlemodel.name
                            };
                        })
                    };
                });
                var statesOrder = Enumerable.From(scope.States.model[0].events).ToDictionary("$.to");
                var series = raw.SelectMany("$.List.Select('$.state')").OrderBy(function (d) {
                    return statesOrder.Contains(d) ? statesOrder.Get(d).order : -1;
                }).Distinct();
                var data = series.Select(function (seri) {
                    return raw.Select(function (r) {
                        return r.List.Where(function (ud) {
                            return ud.state == seri;
                        }).Select(function (ud) {
                            return ud.points;
                        }).DefaultIfEmpty(0.0).Sum();
                    }).ToArray();
                });
                var ticks = raw.Select("s=>s.Faction").ToArray();

                var plot3 = $.jqplot(el[0].id, data.ToArray(), {
                    // Tell the plot to stack the bars.
                    stackSeries: false,
                    series: series.Select(function (x) { return { label: x } }).ToArray(),
                    seriesDefaults: {
                        renderer: $.jqplot.BarRenderer,
                        rendererOptions: {
                            // Put a 30 pixel margin between bars.
                            barMargin: 30,
                            // Highlight bars when mouse button pressed.
                            // Disables default highlighting on mouse over.
                            highlightMouseDown: true
                        },
                        pointLabels: { show: true }
                    },
                    title: "Points by Faction",
                    axes: {
                        xaxis: {
                            renderer: $.jqplot.CategoryAxisRenderer,
                            ticks: ticks
                        }, yaxis: {
                            padMin: 0
                        }
                    },
                    legend: {
                        show: true,
                        location: 'w',
                        placement: 'inside'
                    }
                });
            });
        }
    }
});

app.directive('chartline', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, el, attrs) {

            // set up slider on load
            angular.element(document).ready(function () {

                var raw = Enumerable.From(scope.Tide.model).
                    SelectMany(function (u) {
                        
                        var orderedStates = Enumerable.From(u.States).Where(function (s) { return s.name != "Startup" && s.active }).
                        					                   OrderBy(function (s) { return s.date });
                        var currentObject = new ModelObject({
                            "name": u.name,
                            "points": u.points,
                            "States": [orderedStates.First()]
                        });

                        var states = orderedStates.
                        					                   Select(function (s, i) {
                                                                   if (i != 0)
                        					                            currentObject[s.name].call(currentObject);
                        					                       return {
                        					                           points: u.points,
                        					                           date: new Date(s.date),
                        					                           name: currentObject.current
                        					                       }
                        					                   }).ToArray();
                        return Enumerable.From(states).SelectMany(function (s, idx) {
                            return (idx + 1) == states.length ? [s] :
                                [s, { points: -s.points, date: new Date(states[idx + 1].date.valueOf() - 1000), name: s.name }]
                        });
                    });

                var statesOrder = Enumerable.From(scope.States.model[0].events).ToDictionary("$.to");

                var groups = raw.GroupBy(
                                    function (m) {
                                        return m.name
                                    },
                                    "",
                                    function (key, item) {
                                        return {
                                            name: key,
                                            ItemsByDate: item.GroupBy(function (s) {
                                                return new Date(s.date).setHours(0, 0, 0, 0)
                                            }).Select(function (items) {
                                                return [new Date(items.Key()), items.Sum(function (i) { return i.points })]
                                            }).Where(function (g) {
                                                return g[1] != 0
                                            }).OrderBy(function(g) {return g[0]}).Concat([[new Date(new Date().setHours(0, 0, 0, 0)), 0]])
                                                .Scan([new Date(2014, 12, 29, 0, 0, 0, 0), 0], function (prev, next) { return [next[0], prev[1] + next[1]]; })
                                                .Skip(1).ToArray()
                                        }
                                    }).
                                Where(function (g) {
                                    return g.ItemsByDate.length > 1; //&& !(g.ItemsByDate.length == 2 && g.ItemsByDate[0][1] == g.ItemsByDate[1][1]);
                                }).
                                OrderBy(function (m) {
                                    return statesOrder.Contains(m.name) ? statesOrder.Get(m.name).order : -1;
                                });

                var series = groups.Select(function (g) { return g.name; });
                var data = groups.Select(function (g) { return g.ItemsByDate; });
                var plot3 = $.jqplot(el[0].id, data.ToArray(), {
                    // Tell the plot to stack the bars.
                    series: series.Select(function (x) { return { label: x } }).ToArray(),
                    title: "Rolling tide",
                    legend: {
                        show: true,
                        location: 'w',
                        placement: 'inside'
                    },
                    axes: { xaxis: { renderer: $.jqplot.DateAxisRenderer } },
                    seriesDefaults: {
                        renderer: $.jqplot.LineRenderer
                    }
                });
            });
        }
    }
});


app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.
      when('/tide', {
          templateUrl: 'partials/tide.html',
          controller: 'GreyTideController',
          reloadOnSearch: false
      }).
      when('/states', {
          templateUrl: 'partials/state.html',
          controller: 'StateController',
          reloadOnSearch: false
      }).
      when('/chart', {
          templateUrl: 'partials/chart.html',
          controller: 'GreyTideController',
          reloadOnSearch: false
      }).
      otherwise({
          redirectTo: '/tide'
      });
}]);

app.factory('stateService', ['$rootScope', '$http', function ($rootScope, $http) {
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
        LoadFromJson: function (file) {
            $http.get(file).success(function (data) {
                service.model = data;
                service.SaveState();
            });
        },
        Refresh: function () {
            service.LoadFromJson('data/states.json');
        }
    }

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);

ModelObject = function (json, tideService) {    // my constructor function
    this.name = json.name;
    this.points = json.points;
    this.faction = json.faction;
    this.Pieces = json.Pieces;
    this.tideService = tideService;
    var existingStates = Enumerable.From(json.States).OrderByDescending(function (x) { return x.date; }).Select(function (x) { return { name: x.name, active: true, date: x.date }; });
    if (existingStates.Count() == 0)
        existingStates = Enumerable.From([{ name: "Startup", active: true, date: new Date().toISOString() }]);
    this.States = existingStates.ToArray();
    var lastState = existingStates.First();
    this[lastState.name].call(this);

};

ModelObject.prototype = {

    //onpanic: function (event, from, to) { alert('panic'); },
    //onclear: function (event, from, to) { alert('all is clear'); },
    onafterevent: function (event, from, to) {
        this.States = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.States).Where(function (s) { return s.active })).ToArray();
        if (this.tideService != null)
            this.tideService.SaveState();
    }
};



app.factory('tideService', ['$rootScope', '$http', 'stateService', function ($rootScope, $http, stateService) {
    var storageMethod = localStorage;
    StateMachine.create({
        target: ModelObject.prototype,
        initial: { state: 'None', event: 'init', defer: true },
        events: stateService.model[0].events
    });
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
                                'name': y.name, 'active': true, 'date': y.date
                            };
                        }).ToArray(),
                        'Pieces': x.Pieces
                    };
                }).ToJSON();
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


app.run(['$rootScope', function ($rootScope) {

    //let everthing know that we need to save state now.
    window.onbeforeunload = function (event) {
        $rootScope.$broadcast('savestate');
    };
}]);