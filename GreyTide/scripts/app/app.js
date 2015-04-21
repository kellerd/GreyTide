/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="../angular.js" />
/// <reference path="../angular-route.js" />
/// <reference path="../jqPlot/jquery.jqplot.js" />
/// <reference path="contollers.js" />
var app = angular.module('greyTideApp', ['ngRoute',
  'GreyTideControllers', 'multi-select']);

app.directive('chart', function () {
    return {
        restrict: 'A',
        scope: true,
        //controller: function ($scope, $element, $attrs) {
        //    $scope.onSlide = function (e, ui) {
        //          //        $scope.model = ui.value;

        //        // or set it on the model
        //        // DataModel.model = ui.value;
        //        // add to angular digest cycle
        //        $scope.$digest();
        //    };
        //},
        //          var s1 = Primed = [SW Primed, TyrPrimed]
        //var s2 = Hard Coat = [SW hard coat, Tyr hard coat]
        //   plot3 = $.jqplot('chart3', [Primed,HardCoat,SoftCoat]
        //   plot3 = $.jqplot('chart3', [[SW Primed, TyrPrimed],[SW hard coat, Tyr hard coat],[SW Soft coat, Tyr Soft coat]]
        // Series = "Primed", "Hardcoat", "Softcoat"
        
        link: function (scope, el, attrs) {

            // set up slider on load
            angular.element(document).ready(function () {
                
                var model = Enumerable.From(scope.Tide.model);
                var sum = model.Sum(function (data) { return data.points });
                var groups = model.GroupBy(function (data) { return data.faction });
                var raw = groups.Select(function (model) {
                    return {
                        Faction: model.Key(),
                        List: Enumerable.From(model).Select( function (singlemodel) {
                            return {
                                state: Enumerable.From(singlemodel.States).Where("d=>d.active").OrderByDescending("d=>d.date").First().name,
                                points: singlemodel.points,
                                name: singlemodel.name
                            };
                        })
                    };
                });
                var series = raw.SelectMany("$.List.Select('$.state')").Distinct();
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
                    stackSeries: true,
                    series: series.Select(function (x) { return { label: x }}).ToArray(),
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
                        location: 's',
                        placement: 'outside'
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
        existingStates = Enumerable.From([{ name: "Startup", active:true,date: new Date().toISOString() }]);
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
                                'name': y.name, 'active':true,'date': y.date
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
        LoadFromFile: function(file) {
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