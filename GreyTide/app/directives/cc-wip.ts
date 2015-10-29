'use strict';
module App.Directives
{
    //Usage:
        //<li data-cc-wip
        //  wip="vm.wip"
        //  routes="vm.routes"
        //  changed-event="{{vm.wipChangedEvent}}"
        //  class="nlightblue"></li>
    interface ICcWip extends ng.IDirective
    {
    }

    interface ICcWipScope extends ng.IScope
    {
        wip: any;
        changedEvent: any;
        routes: any;
        wipExists: any;
        wipRoute: any;
        getWipClass: any;
    }

    class CcWip implements ICcWip
    {
        static directiveId: string = 'ccWip';
        restrict: string = "A";
        template = this.getTemplate();
        scope = {
            'wip': '=',
            'changedEvent': '@',
            'routes': '='
        }
        controller = ['$scope', $scope => new WipController($scope)];

        constructor(private $route)
        {
        }
        link = (scope: ICcWipScope, element, attrs) =>
        {
            var _that = this;
            scope.$watch(wipIsCurrent, function (value) {
                value ? element.addClass('current') : element.removeClass('current');
            });

            function wipIsCurrent() {
                if (!_that.$route.current || !_that.$route.current.title) {
                    return false;
                }
                return _that.$route.current.title.substr(0, WipController.wipRouteName.length) === WipController.wipRouteName;
            }
        }
        private getTemplate() {
            return '<a href="#{{wipRoute.url}}" >'
                + '<i class="fa fa-asterisk" data-ng-class="getWipClass()"></i>'
                + 'Work in Progress ({{wip.length}})</a>';
        }
    }

    class WipController {
        static wipRouteName = 'workinprogress';

        constructor(private $scope: ICcWipScope) {
            $scope.wipExists = function () { return !!$scope.wip.length; };
            $scope.wipRoute = undefined;
            $scope.getWipClass = function () {
                return $scope.wipExists() ? ['fa', 'fa-asterisk', 'fa-asterisk-alert'] : ['fa', 'fa-asterisk'];
            };
            this.activate();
        }

        private activate() {
            var eventName = this.$scope.changedEvent;
            this.$scope.$on(eventName, function (event, data) {
                this.$scope.wip = data.wip;
            });
            this.$scope.wipRoute = this.$scope.routes.filter(function (r) {
                return r.config.title === WipController.wipRouteName;
            })[0];
        }
    }

    // Register in angular app
    app.directive(CcWip.directiveId, ['$route', $route => new CcWip($route)]);
} 