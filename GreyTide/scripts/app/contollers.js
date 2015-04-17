/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="app.js" />
var GreyTideControllers = angular.module('GreyTideControllers', []);

GreyTideControllers.controller('StateController', ['$scope', '$http', 'stateService', function ($scope, $http, stateService) {
    $scope.States = stateService;

    $scope.Insert = function (stateMachine, newName, newFrom, newTo) {
        stateMachine.events.push({
            "name": newName,
            "from": newFrom,
            "to": newTo
        })
        $scope.States.SaveState();
    };
    $scope.insertvisible = false;

    $scope.Remove = function (stateMachine,item) {
        
        var index = stateMachine.events.indexOf(item)
        stateMachine.events.splice(index, 1);
        $scope.States.SaveState();
    }

    $scope.RefreshFromStore = function () {
        $scope.States.Refresh();
    }
}]);

GreyTideControllers.controller('GreyTideController', ['$scope', '$filter', 'tideService', 'stateService', function ($scope, $filter, tideService, stateService) {
    $scope.Tide = tideService;
    $scope.States = stateService;
    $scope.orderProp = "[faction,name]";
    $scope.setActive = function (model, item) {
        if (item.active == true) {
            model[item.name].call(model);
        }
    }
    $scope.Remove = function (item) {
        var index = $scope.Tide.model.indexOf(item)
        $scope.Tide.model.splice(index, 1);
        $scope.Tide.SaveState();
    }
    $scope.RemoveState = function (model, item) {
        var index = model.States.indexOf(item)
        model.States.splice(index, 1);
        $scope.Tide.SaveState();
    }
    $scope.Insert = function (newName, newFaction, newPoints) {
        $scope.Tide.model.push(new ModelObject({
            "name": newName,
            "points": newPoints,
            "faction": newFaction,
            "States": [{ name: "Startup", date: new Date().toISOString() }]
        }, tideService))
        $scope.Tide.SaveState();
    };
    $scope.query5 = true;
    $scope.insertvisible = false;
    $scope.Factions = Enumerable.From($scope.Tide.model).Select(function (x) {
        return x.faction;
    }).Distinct().Select(function (x) { return { "name": x } }).ToArray();


    $scope.RefreshFromStore = function () {
        $scope.Tide.Refresh();
    }
    //$scope.filterModelOnState = function (stateName, active) {
    //    return function (model) {
    //        return !stateName || 0 === stateName.length || Enumerable.From(model.States).Any(function (s) { return s.name == stateName && s.active == active; });
    //    }
    //};
}]);

GreyTideControllers.controller('ChartController', ['$scope', 'tideService', 'stateService', function ($scope, tideService, stateService) {
    $scope.Tide = tideService;
    
}]);