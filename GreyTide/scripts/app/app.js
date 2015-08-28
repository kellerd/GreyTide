/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="../angular.js" />
/// <reference path="../angular-route.js" />
/// <reference path="contollers.js" />
var app = angular.module('greyTideApp', ['ngRoute',
  'GreyTideControllers', 'multi-select', 'xeditable',    'breeze.angular' ]);

app.run(['$rootScope', function ($rootScope) {

    //let everthing know that we need to save state now.
    window.onbeforeunload = function (event) {
        $rootScope.$broadcast('savestate');
    };
}]);

app.run(function (editableOptions) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});

app.run(['breeze', function (breeze) { }]);