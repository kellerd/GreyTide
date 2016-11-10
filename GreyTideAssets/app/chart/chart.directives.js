/// <reference path="../../scripts/typings/d3/d3.d.ts" />
/// <reference path="../../scripts/typings/d3/nvd3.d.ts" />
'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var App;
(function (App) {
    var Directives;
    (function (Directives) {
        var TideChart = (function () {
            function TideChart(config, common, directiveId) {
                var _this = this;
                this.config = config;
                this.common = common;
                this.directiveId = directiveId;
                this.initChart = function (chart, svgSelector, chartdata) {
                    chartdata().then(function (data) {
                        var updateSize = function () {
                            var width = nv.utils.windowSize().width - 220, height = Math.max(nv.utils.windowSize().height / 2 - 40, 400);
                            d3.select(svgSelector)
                                .attr('width', width)
                                .attr('height', height);
                            chart.width(width).height(height);
                            chart.update();
                        };
                        d3.select(svgSelector).datum(data).call(chart);
                        updateSize();
                        nv.utils.windowResize(updateSize);
                    }).catch(function (error) { _this.common.logger.logError(error, null, _this.directiveId, true); });
                };
            }
            return TideChart;
        }());
        var ChartBar = (function (_super) {
            __extends(ChartBar, _super);
            function ChartBar(config, common) {
                var _this = this;
                _super.call(this, config, common, ChartBar.directiveId);
                this.restrict = "A";
                this.link = function (scope, el, attrs) {
                    angular.element(document).ready(function () {
                        var svgSelector = '#' + el[0].id + ' svg';
                        nv.addGraph(function () {
                            var chart;
                            chart = nv.models.multiBarChart();
                            chart.yAxis.tickFormat(d3.format(',.0f'));
                            _this.initChart(chart, svgSelector, scope.vm.getBarChart);
                            return chart;
                        });
                    });
                };
            }
            ChartBar.directiveId = 'chartbar';
            return ChartBar;
        }(TideChart));
        var ChartLine = (function (_super) {
            __extends(ChartLine, _super);
            function ChartLine(config, common) {
                var _this = this;
                _super.call(this, config, common, ChartLine.directiveId);
                this.restrict = "A";
                this.link = function (scope, el, attrs) {
                    angular.element(document).ready(function () {
                        var svgSelector = '#' + el[0].id + ' svg';
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
                            _this.initChart(chart, svgSelector, scope.vm.getLineChart);
                            return chart;
                        });
                    });
                };
            }
            ChartLine.directiveId = 'chartline';
            return ChartLine;
        }(TideChart));
        // Register in angular app
        App.app.directive(ChartBar.directiveId, ['config', 'common', function (c, cm) { return new ChartBar(c, cm); }]);
        App.app.directive(ChartLine.directiveId, ['config', 'common', function (c, cm) { return new ChartLine(c, cm); }]);
    })(Directives = App.Directives || (App.Directives = {}));
})(App || (App = {}));
//# sourceMappingURL=chart.directives.js.map