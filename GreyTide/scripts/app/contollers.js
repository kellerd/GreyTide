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
            item.date = new Date().toISOString();
            model[item.name].call(model);
        }
    }
    
    $scope.RemoveState = function (model, item) {
        var index = model.States.indexOf(item)
        model.States.splice(index, 1);
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
        model.Items.splice(0,0,new ModelObject({
            "name": 'New',
            "points": 0,
            "faction": isRoot ? 'Faction':null,
            "States": isRoot
                            ? [{ name: "Startup", date: new Date().toISOString() }]
                            : Enumerable.From(model.States).Where(function (d) { return d.active; }).ToArray()
        }, tideService, model));
        $scope.Tide.SaveState();
    };
    $scope.RemoveItem = function (model, item) {
        var index = model.Items.indexOf(item);
        model.Items.splice(index, 1);
        $scope.Tide.SaveState();
    };

    $scope.RefreshFromStore = function () {
        $scope.Tide.Refresh();
    };
    //$scope.filterModelOnState = function (stateName, active) {
    //    return function (model) {
    //        return !stateName || 0 === stateName.length || Enumerable.From(model.States).Any(function (s) { return s.name == stateName && s.active == active; });
    //    }
    //};
}]);

GreyTideControllers.controller('ChartController', ['$scope', 'tideService', 'stateService', function ($scope, tideService, stateService) {
    $scope.Tide = tideService;
    $scope.States = stateService;
}]);