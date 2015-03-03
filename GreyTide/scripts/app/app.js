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
          //        $scope.model = ui.value;
          //        // or set it on the model
          //        // DataModel.model = ui.value;
          //        // add to angular digest cycle
          //        $scope.$digest();
          //    };
          //},
          link: function (scope, el, attrs) {

              // set up slider on load
              angular.element(document).ready(function () {
                  var data = Enumerable.From(scope.Tide.model)
                  
                  var data = jQuery.map(scope.Tide.model, function (model) {
                      return [jQuery.map(model['States'], function (state) {
                           return state["active"] ? 1 : 0;
                        })];
                  });
                  var ticks = jQuery.map(scope.Tide.model, function (model) { return model['faction']; });
                  var series = jQuery.map(scope.States.model, function (state) { return state['name']; });
                  var plot3 = $.jqplot(el[0].id, [[0, 1],[0, 1],[1, 1],[0, 1],[1, 1],[0, 1],[0, 1],[0, 1],[1, 1]], {
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
            { "name": "", "isDefault": false }
        ],

        SaveState: function () {
            storageMethod.stateService = angular.toJson(service.model);
        },

        RestoreState: function () {
            if (storageMethod.stateService)
                service.model = angular.fromJson(storageMethod.stateService);
            if (service.model.length == 0 || service.model[0].name == "" || true)
                service.LoadFromJson('data/states.json');
        },
        LoadFromJson: function (file) {
            $http.get(file).success(function (data) {
                service.model = data;
                service.SaveState();
            });
        }
    }

    $rootScope.$on("savestate", service.SaveState);
    $rootScope.$on("restorestate", service.RestoreState);
    service.RestoreState();

    return service;
}]);

app.factory('tideService', ['$rootScope', '$http', function ($rootScope, $http) {
    var storageMethod = localStorage;
    var service = {

        model: [
                    {
                        'name': '',
                        'points': 0,
                        'faction': '',
                        'States': [
                                    { 'name': '', 'active': '', 'date': '' }
                        ]
                    }
        ],

        SaveState: function () {
            storageMethod.tideService = Enumerable.From(service.model).Select(function (x) {
                return {
                    'name': x.name,
                    'points': x.points,
                    'faction': x.faction,
                    'States': Enumerable.From(x.States).Select(function (y) {
                        return {
                            'name': y.name, 'active': y.active, 'date': y.date
                        };
                    }).ToArray()
                };
            }).ToJSON();
        },

        RestoreState: function () {
            if (storageMethod.tideService)
                service.model = angular.fromJson(storageMethod.tideService);
            if (service.model.length == 0 || service.model[0].name == "" )
                service.LoadFromJson('data/models.json');
        },
        LoadFromJson: function (file) {
            $http.get(file, { cache: false }).success(function (data) {
                service.model = data;
                service.SaveState();
            }).error(function(data, status, headers, config) {
                alert(status + ":" + data);
            });
        },
        LastState: function(item) {
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