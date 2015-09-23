/// <reference path="../../scripts/typings/d3/d3.d.ts" />
/// <reference path="../../scripts/typings/d3/nvd3.d.ts" />

'use strict';
module App.Directives {
    //Usage:
    //<div id="chartbar" chartbar chartdata="{{vm.barData}}">
    //<svg></svg>
    //< /div>

    interface IChartBar extends ng.IDirective {
    }

    interface IChartScope extends ng.IScope {
        vm:App.Controllers.Chart
    }
    interface IChartLine extends ng.IDirective {
    }

    class TideChart {

        constructor(private config: IConfigurations) {
        }
        protected static initChart = (chart, svgSelector: string, chartdata:() => ng.IPromise<any[]>) => {
            chartdata().then(data => {
                var updateSize = () => {
                    var width = nv.utils.windowSize().width - 220,
                        height = Math.max(nv.utils.windowSize().height / 2 - 40, 400);

                    d3.select(svgSelector)
                        .attr('width', width)
                        .attr('height', height)
                    chart.width(width).height(height)
                    chart.update();
                };
                d3.select(svgSelector).datum(data).call(chart);
                updateSize();
                nv.utils.windowResize(updateSize);
            });
        }
    }

    class ChartBar extends TideChart implements IChartBar {
        static directiveId: string = 'chartbar';
        restrict: string = "A";

        constructor(config: IConfigurations) {
            super(config);
        }

        link = (scope: IChartScope, el, attrs) => {
            angular.element(document).ready( () => {
                var svgSelector = '#' + el[0].id + ' svg';
                nv.addGraph(()=>{
                    var chart;
                    chart = nv.models.multiBarChart();
                    chart.yAxis.tickFormat(d3.format(',.0f'));
                    TideChart.initChart(chart, svgSelector, scope.vm.getBarChart);
                    return chart;
                });
            });
        }
    }
    class ChartLine extends TideChart implements IChartLine {
        static directiveId: string = 'chartline';
        restrict: string = "A";

        constructor(config: IConfigurations) {
            super(config);
        }

        link = (scope: IChartScope, el, attrs) => {
            angular.element(document).ready(() => {
                var svgSelector = '#' + el[0].id + ' svg';
                nv.addGraph( () => {
                    var chart = nv.models.stackedAreaChart()
                        .margin({ right: 100, bottom: 30, left: 100 })
                        .x(function (d) { return d[0]; })   //We can modify the data accessor functions...
                        .y(function (d) { return d[1]; })   //...in case your data is formatted differently.
                        .useInteractiveGuideline(true) //Tooltips which show all data points. Very nice!
                        .showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                        .clipEdge(true);

                    //Format x-axis labels with custom function.
                    chart.xAxis
                        .tickFormat(function (d) {
                            return d3.time.format('%x')(new Date(d))
                        });
                    chart.yAxis.
                        tickFormat(function (d) {
                            return d3.format(',.0f')(d);
                        });
                    TideChart.initChart(chart, svgSelector, scope.vm.getLineChart);
                    return chart;
                });
            });
        }
    }

    // Register in angular app
    app.directive(ChartBar.directiveId, ['config', c => new ChartBar(c)]);
    app.directive(ChartLine.directiveId, ['config', c => new ChartLine(c)]);
}
