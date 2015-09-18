/// <reference path="../../../models/scripts/typings/d3/d3.d.ts" />
/// <reference path="../../../models/scripts/typings/nvd3/nvd3.d.ts" />
'use strict';
var App;
(function (App) {
    var Directives;
    (function (Directives) {
        var ChartBar = (function () {
            function ChartBar(config) {
                this.config = config;
                this.restrict = "A";
                this.link = function (scope, el, attrs) {
                    angular.element(document).ready(function () {
                        var data = scope.chartdata;
                        var chart;
                        nv.addGraph(function () {
                            chart = nv.models.multiBarChart();
                            //chart.reduceXTicks(false).staggerLabels(true);
                            chart.yAxis
                                .tickFormat(d3.format(',.0f'));
                            d3.select('#' + el[0].id + ' svg')
                                .datum(data)
                                .call(chart);
                            var updateSize = function () {
                                var width = nv.utils.windowSize().width - 40, height = Math.max(nv.utils.windowSize().height / 2 - 40, 400);
                                d3.select('#' + el[0].id + ' svg')
                                    .attr('width', width)
                                    .attr('height', height);
                                chart.width(width).height(height);
                                chart.update();
                            };
                            updateSize();
                            nv.utils.windowResize(updateSize);
                            return chart;
                        });
                    });
                };
            }
            ChartBar.directiveId = 'chartbar';
            return ChartBar;
        })();
        // Register in angular app
        App.app.directive(ChartBar.directiveId, ['config', function (c) { return new ChartBar(c); }]);
    })(Directives = App.Directives || (App.Directives = {}));
})(App || (App = {}));
var app = angular.module('greyTideApp');
app.directive('chartbar', function () {
    return {
        restrict: 'A',
        scope: { 'chartdata': '@' },
        link: function (scope, el, attrs) {
        }
    };
});
app.directive('chartline', ['breeze', 'greyTideContext', function (breeze, greyTideContext) {
        return {
            restrict: 'A',
            scope: { 'chartdata': '@' },
            link: function (scope, el, attrs) {
                // set up slider on load
                angular.element(document).ready(function () {
                    var data = scope.chartdata;
                    nv.addGraph(function () {
                        var chart = nv.models.stackedAreaChart()
                            .margin({ right: 100, bottom: 30, left: 100 })
                            .x(function (d) { return d[0]; }) //We can modify the data accessor functions...
                            .y(function (d) { return d[1]; }) //...in case your data is formatted differently.
                            .useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
                            .showControls(true) //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                            .clipEdge(true);
                        //Format x-axis labels with custom function.
                        chart.xAxis
                            .tickFormat(function (d) {
                            return d3.time.format('%x')(new Date(d));
                        });
                        chart.yAxis.
                            tickFormat(function (d) {
                            return d3.format(',.0f')(d);
                        });
                        d3.select('#' + el[0].id + ' svg')
                            .datum(data)
                            .transition().duration(500)
                            .call(chart);
                        var updateSize = function () {
                            var width = nv.utils.windowSize().width - 40, height = Math.max(nv.utils.windowSize().height / 2 - 40, 400);
                            d3.select('#' + el[0].id + ' svg')
                                .attr('width', width)
                                .attr('height', height);
                            chart.width(width).height(height);
                            chart.update();
                        };
                        updateSize();
                        nv.utils.windowResize(updateSize);
                        return chart;
                    });
                });
            }
        };
    }]);