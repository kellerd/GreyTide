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

                var data = Enumerable.From(scope.Tide.model);
                var sum = data.Sum("$.points")
                var raw = data.GroupBy("$.faction").Select("{Faction:$.Key(),List:$.Select('{state:$.States.OrderByDescending('$.date'),points:100.0*$.points/" + sum + "}')}");
                var series = raw.SelectMany("$.List.Select('$.state').Distinct()");

                //var raw = data.GroupBy(m => m["faction"]).Select(u => new {Faction = u.Key,
                //          List = u.Select(m => new { state = m["States"].Where(s => s["active"].ToString() == "Yes").
                //                                  OrderByDescending(s => DateTime.Parse((s["date"] ?? "1970-01-01").ToString())).
                //                                  First()["name"]
                //                                   , points = 100.0d * m["points"].ToObject<double>() / u.Sum(p => p["points"].ToObject<double>())
                //          }
                //      )
                //  }
                // );




                //  var series = raw.SelectMany(u => u.List.Select(ud => ud.state)).Distinct();
                //  var dataPoints = series.Select(seri => raw.Select(r => r.List.Where(ud => ud.state.Equals(seri)).Select(ud => ud.points).DefaultIfEmpty(0d)));










                var data = Enumerable.From(scope.Tide.model)

                var data = jQuery.map(scope.Tide.model, function (model) {
                    return [jQuery.map(model['States'], function (state) {
                        return state["active"] ? 1 : 0;
                    })];
                });
                var ticks = jQuery.map(scope.Tide.model, function (model) { return model['faction']; });
                var series = jQuery.map(scope.States.model, function (state) { return state['name']; });
                var plot3 = $.jqplot(el[0].id, [[0, 1], [0, 1], [1, 1], [0, 1], [1, 1], [0, 1], [0, 1], [0, 1], [1, 1]], {
                    // Tell the plot to stack the bars.
                    stackSeries: true,
                    series: series,
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
                    title: "By Date",
                    axes: {
                        xaxis: {
                            renderer: $.jqplot.CategoryAxisRenderer,
                            ticks: ticks
                        },
                        yaxis: {
                            // Don't pad out the bottom of the data range.  By default,
                            // axes scaled as if data extended 10% above and below the
                            // actual range to prevent data points right on grid boundaries.
                            // Don't want to do that here.
                            padMin: 0
                        }
                    },
                    legend: {
                        show: true,
                        location: 'e',
                        placement: 'outside'
                    }
                });

            });
        }
    }
});


app.config(['$routeProvider',
  function ($routeProvider) {
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
    this.tideService = tideService;
    var existingStates = Enumerable.From(json.States).OrderBy(function (x) { return x.date; }).Select(function (x) { return { name: x.name, active: true, date: x.date }; });
    this.States = existingStates.ToArray();
    var lastState = existingStates.FirstOrDefault("Startup");
    this[lastState.name].call(this);

};

ModelObject.prototype = {

    //onpanic: function (event, from, to) { alert('panic'); },
    //onclear: function (event, from, to) { alert('all is clear'); },
    onafterevent: function (event, from, to) {
        this.States = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: (new Date(), 'yyyy-MM-dd') } }).Union(Enumerable.From(this.States).Where(function (s) { return s.active })).ToArray();
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

        SaveState: function () {
            if (service.model.length > 0) {
                //var storageMethod.tideService = Enumerable...

                var mod = Enumerable.From(service.model).Select(function (x) {
                    return {
                        'name': x.name,
                        'points': x.points,
                        'faction': x.faction,
                        'States': Enumerable.From(x.States).Where(function (x) { return x.active }).Select(function (y) {
                            return {
                                'name': y.name, 'date': y.date
                            };
                        }).ToArray()
                    };
                }).ToJSON();
            }
        },

        RestoreState: function () {
            //if (storageMethod.tideService)
            //    service.model = angular.fromJson(storageMethod.tideService);
            //if (service.model.length == 0 || service.model[0].name == "")
            //    service.LoadFromJson('data/models.json');
        },
        LoadFromJson: function (file) {
            $http.get(file, { cache: false }).success(function (data) {
                service.model = Enumerable.From(data).Select(function (x) { return new ModelObject(x, service) });
                service.SaveState();
            }).error(function (data, status, headers, config) {
                alert(status + ":" + data);
            });
        },
        LastState: function (item) {
            return Enumerable.From(item.States).Where(function (x) { return x.active; }).Max(function (x) { return x.date; });
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