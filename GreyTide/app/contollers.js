/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="app.js" />
/// <reference path="tideservice.js" />
/// <reference path="state-machine.js" />
/// <reference path="stateservice.js" />
/// <reference path="ModelObject.js" />
/// <reference path="route.js" />
/// <reference path="chart.js" />
/// <reference path="ModelObject.js" />
var GreyTideControllers = angular.module('GreyTideControllers', []);

GreyTideControllers.controller('StateController', ['$scope', '$http', 'stateService', function ($scope, $http, stateService) {
    $scope.states = stateService;

    $scope.Insert = function (stateMachine, newName, newFrom, newTo) {
        stateMachine.events.push({
            "name": newName,
            "from": newFrom,
            "to": newTo
        })
        $scope.states.SaveState();
    };
    $scope.insertvisible = false;

    $scope.Remove = function (stateMachine,item) {
        
        var index = stateMachine.events.indexOf(item)
        stateMachine.events.splice(index, 1);
        $scope.states.SaveState();
    }

    $scope.RefreshFromStore = function () {
        $scope.states.Refresh();
    }
}]);

GreyTideControllers.controller('GreyTideController', ['$scope', '$filter', 'tideService', 'stateService', function ($scope, $filter, tideService, stateService) {
    $scope.Tide = tideService;
    $scope.states = stateService;
    $scope.orderProp = "[faction,name]";
    $scope.setActive = function (model, item) {
        if (item.active == true) {
            item.date = new Date().toISOString();
            model[item.name].call(model);
        }
    }
    
    $scope.RemoveState = function (model, item) {
        var index = model.states.indexOf(item)
        model.states.splice(index, 1);
        $scope.Tide.SaveState();
    }
    
    $scope.query5 = true;

    $scope.criteriaMatch = function () {
        var strCheck = function (str) {
            return ($scope.query1 == undefined ||  (str && str.indexOf($scope.query1) > -1)) && ($scope.query2 == undefined || (str && str.indexOf($scope.query2) > -1));
        }
        return function (item) {
            return item.parent ||
                (
                    (!$scope.query5 || item.current != "Completed") &&
                    (strCheck(item.name) || strCheck(item.faction) || strCheck((item.points | 0).toString())) &&
                    (!$scope.query3 || item.current.indexOf($scope.query3) > -1)
                );
        };
    };

    $scope.AddItem = function (model, isRoot) {
        model.items.splice(0, 0, new ModelObject({
            "name": 'New',
            "points": 0,
            "faction": isRoot ? 'Faction':null,
            "states": isRoot
                            ? [{ name: "Startup", date: new Date().toISOString() }]
                            : Enumerable.From(model.states).Where(function (d) { return d.active; }).ToArray()
        }, tideService, model));
        $scope.Tide.SaveState();
    };
    $scope.RemoveItem = function (model, item) {
        var index = model.items.indexOf(item);
        model.items.splice(index, 1);
        $scope.Tide.SaveState();
    };

    $scope.RefreshFromStore = function () {
        $scope.Tide.Refresh();
    };
}]);

GreyTideControllers.controller('ChartController', ['$scope', 'tideService', 'stateService', function ($scope, tideService, stateService) {
    $scope.Tide = tideService;
    $scope.states = stateService;
}]);