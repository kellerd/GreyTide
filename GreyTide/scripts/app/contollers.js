/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
var GreyTideControllers = angular.module('GreyTideControllers', []);

GreyTideControllers.controller('StateController', ['$scope', '$http', 'stateService', function ($scope, $http, stateService) {
    $scope.States = stateService;

    $scope.Insert = function (newName, newDefault) {
        $scope.States.model.push({
            "name": newName,
            "isDefault": newDefault
        })
        $scope.States.SaveState();
    };
    $scope.insertvisible = false;

    $scope.Remove = function (item) {
        
        var index = $scope.States.model.indexOf(item)
        $scope.States.model.splice(index, 1);
        $scope.States.SaveState();
    }
}]);

GreyTideControllers.controller('GreyTideController', ['$scope', '$filter', 'tideService', 'stateService', function ($scope, $filter, tideService, stateService) {
    $scope.Tide = tideService;
    $scope.States = stateService;
    $scope.orderProp = "[faction,name]";
    $scope.setActive = function (model, item) {
        var updateItem = Enumerable.From(model.States).Where(function (x) { return x.name == item.name }).First();
        updateItem.active = item.active;
        if (item.active)
            updateItem.date = $filter('date')(new Date(), 'yyyy-MM-dd');
        else
            updateItem.date = null;
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
        $scope.Tide.model.push({
            "name": newName,
            "points": newPoints,
            "faction": newFaction,
            "States": Enumerable.From(stateService.model).Where(function (x) { return x.isDefault }).Select(function (x) { return { "name": x.name, "active": false, "date": null }; }).ToArray()
        })
        $scope.Tide.SaveState();
    };
    $scope.query5 = true;
    $scope.insertvisible = false;
    $scope.Factions = Enumerable.From($scope.Tide.model).Select(function (x) {
        return x.faction;
    }).Distinct().Select(function (x) { return { "name": x } }).ToArray();
    $scope.filterModelOnState = function (stateName, active) {
        return function (model) {
            return !stateName || 0 === stateName.length || Enumerable.From(model.States).Any(function (s) { return s.name == stateName && s.active == active; });
        }
    };
}]);

GreyTideControllers.controller('ChartController', ['$scope', 'tideService', 'stateService', function ($scope, tideService, stateService) {
    $scope.Tide = tideService;
    
}]);