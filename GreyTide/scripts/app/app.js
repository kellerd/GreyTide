﻿/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="../angular.js" />
/// <reference path="../angular-route.js" />
/// <reference path="contollers.js" />
var app = angular.module('greyTideApp', ['ngRoute',
  'GreyTideControllers', 'multi-select', 'xeditable',    'breeze.angular' ]);

angular.module('greyTideApp').factory('entityManagerFactory', ['breeze', emFactory]);

app.run(['breeze', function (breeze) { }]);

function emFactory(breeze) {
    // Convert properties between server-side PascalCase and client-side camelCase
    breeze.NamingConvention.camelCase.setAsDefault();

    // Identify the endpoint for the remote data service
    //var serviceRoot = window.location.protocol + '//' + window.location.host + '/';
    var serviceRoot = window.location.protocol + '//localhost:54040/';

    // the "factory" services exposes two members
    var factory = {
        newManager: function () {
            return new breeze.EntityManager(new breeze.DataService({
                serviceName: serviceRoot + "breeze/GreyTide/",
                hasServerMetadata: false // don't ask the server for metadata
                })
            );
        },
        serviceName: serviceName
    };

    return factory;
}
app.run(['$rootScope', function ($rootScope) {

    //let everthing know that we need to save state now.
    window.onbeforeunload = function (event) {
        $rootScope.$broadcast('savestate');
    };
}]);

app.run(function (editableOptions) {
    editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});

