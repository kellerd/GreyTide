/// <reference path="../angular.js" />
/// <reference path="../angular-route.js" />
var app = angular.module('greyTideApp');


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
