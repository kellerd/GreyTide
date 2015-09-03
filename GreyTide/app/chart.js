
/// <reference path="../scripts/linq-vsdoc.js" />
/// <reference path="../scripts/linq.min.js" />
/// <reference path="../scripts/angular.js" />
/// <reference path="../scripts/d3/d3.js" />
/// <reference path="../scripts/nv.d3.js" />
var app = angular.module('greyTideApp');


app.directive('chartbar', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, el, attrs) {

            angular.element(document).ready(function () {

                var model = Enumerable.From(scope.Tide.items);
                var groups = model.GroupBy(function (data) { return data.faction });
                var zeroUnion = model.Distinct(function (data) { return data.current }).Select(function (data) { return { x: data.current, y: 0 }; });
                var data = groups.Select(function (model) {
                    return {
                        key: model.Key(),
                        values:
                            Enumerable.
                            From(model).
                            GroupBy(function (models) { return models.current; },null, function (key, models) {
                                return {
                                    x: key,
                                    y: models.Select(function(d){ return d.points;}).DefaultIfEmpty(0).Sum()
                                };
                            }).
                            Union(zeroUnion, function (data) { return data.x }).
                            ToArray()
                        }
                }).OrderBy("$.key");

                var chart;
                nv.addGraph(function () {
                    chart = nv.models.multiBarChart();
                    //chart.reduceXTicks(false).staggerLabels(true);
                    chart.yAxis
                        .tickFormat(d3.format(',.0f'))
                    ;

                    d3.select('#' + el[0].id + ' svg')
                    .datum(data.ToArray())
                    .call(chart);

                    var updateSize = function () {
                        var width = nv.utils.windowSize().width - 40,
                       height = Math.max(nv.utils.windowSize().height / 2 - 40, 400);

                        d3.select('#' + el[0].id + ' svg')
                        .attr('width', width)
                        .attr('height', height)
                        chart.width(width).height(height)
                        chart.update();
                    };

                    updateSize();
                    nv.utils.windowResize(updateSize);
                    return chart;
                });
            });
        }
    }
});


app.directive('chartline', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, el, attrs) {

            // set up slider on load
            angular.element(document).ready(function () {

                var raw = Enumerable.From(scope.Tide.items).
                    SelectMany(function (u) {

                        var orderedStates = Enumerable.From(u.states).Where(function (s) { return s.name != "Startup" && s.active }).
                        					                   OrderBy(function (s) { return s.date });
                        var currentObject = new Model({
                            "name": u.name,
                            "points": u.points,
                            "states": [orderedStates.First()]
                        });

                        var states = orderedStates.
                        					                   Select(function (s, i) {
                        					                       if (i != 0)
                        					                           currentObject[s.name].call(currentObject);
                        					                       return {
                        					                           points: u.points,
                        					                           date: new Date(s.date),
                        					                           name: currentObject.current
                        					                       }
                        					                   }).ToArray();
                        return Enumerable.From(states).SelectMany(function (s, idx) {
                            return (idx + 1) == states.length ? [s] :
                                [s, { points: -s.points, date: new Date(states[idx + 1].date.valueOf() - 1000), name: s.name }]
                        });
                    });

                var statesOrder = Enumerable.From(scope.states.model[0].events).ToDictionary("$.to");

                var dateUnion =
                    raw.
                    GroupBy(function (s) { return new Date(s.date).setHours(0, 0, 0, 0); }, null, function (key, d) {
                        return { points: 0, date: key }
                    });

                var groups = raw.GroupBy(
                                    function (m) {
                                        return m.name
                                    },
                                    "",
                                    function (key, item) {
                                        return {
                                            name: key,
                                            ItemsByDate:
                                                Enumerable.From(item).
                                                Union(dateUnion, function (x) { return x.date }).
                                                GroupBy(function (s) {
                                                    return new Date(s.date).setHours(0, 0, 0, 0)
                                                }).
                                                Select(function (items) {
                                                    return [new Date(items.Key()), items.Sum(function (i) { return i.points })]
                                                }).
                                                OrderBy(function (g) { return g[0] }).
                                                Concat([[new Date(), 0]]).
                                                Scan([new Date(2014, 12, 29, 0, 0, 0, 0), 0], function (prev, next) { return [next[0], prev[1] + next[1]]; }).
                                                Skip(1).
                                                ToArray()
                                        }
                                    }).
                                Where(function (g) {
                                    return g.ItemsByDate.length > 1;
                                }).
                                OrderBy(function (m) {
                                    return statesOrder.Contains(m.name) ? statesOrder.Get(m.name).order : -1;
                                });

                var data = groups.Select(function (g) { return { 'key': g.name, 'values': g.ItemsByDate }; });

                nv.addGraph(function () {
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
                    chart.yAxisTickFormat(d3.format(',.0f'));
                    d3.select('#' + el[0].id + ' svg')
                        .datum(data.ToArray())
                        .transition().duration(500)
                        .call(chart);

                    var updateSize = function () {
                        var width = nv.utils.windowSize().width - 40,
                       height = Math.max(nv.utils.windowSize().height / 2 - 40, 400);

                        d3.select('#' + el[0].id + ' svg')
                        .attr('width', width)
                        .attr('height', height)
                        chart.width(width).height(height)
                        chart.update();
                    };

                    updateSize();
                    nv.utils.windowResize(updateSize);

                    return chart;
                });

            });
        }
    }
});


//app.directive('chartbar', function () {
//    return {
//        restrict: 'A',
//        scope: true,
//        link: function (scope, el, attrs) {

//            angular.element(document).ready(function () {

//                var model = Enumerable.From(scope.Tide.items);
//                var groups = model.GroupBy(function (data) { return data.faction });
//                var raw = groups.Select(function (model) {
//                    return {
//                        Faction: model.Key(),
//                        List: Enumerable.From(model).Select(function (singlemodel) {
//                            return {
//                                state: singlemodel.current,
//                                points: singlemodel.points,
//                                name: singlemodel.name
//                            };
//                        })
//                    };
//                });
//                var statesOrder = Enumerable.From(scope.states.model[0].events).ToDictionary("$.to");
//                var series = raw.SelectMany("$.List.Select('$.state')").OrderBy(function (d) {
//                    return statesOrder.Contains(d) ? statesOrder.Get(d).order : -1;
//                }).Distinct();
//                var data = series.Select(function (seri) {
//                    return raw.Select(function (r) {
//                        return r.List.Where(function (ud) {
//                            return ud.state == seri;
//                        }).Select(function (ud) {
//                            return ud.points;
//                        }).DefaultIfEmpty(0.0).Sum();
//                    }).ToArray();
//                });
//                var ticks = raw.Select("s=>s.Faction").ToArray();

//                //var plot3 = $.jqplot(el[0].id, data.ToArray(), {
//                //    // Tell the plot to stack the bars.
//                //    stackSeries: true,
//                //    series: series.Select(function (x) { return { label: x } }).ToArray(),
//                //    seriesDefaults: {
//                //        renderer: $.jqplot.BarRenderer,
//                //        rendererOptions: {
//                //            // Put a 30 pixel margin between bars.
//                //            barMargin: 30,
//                //            // Highlight bars when mouse button pressed.
//                //            // Disables default highlighting on mouse over.
//                //            highlightMouseDown: true
//                //        },
//                //        pointLabels: { show: true }
//                //    },
//                //    title: "Points by Faction",
//                //    axes: {
//                //        xaxis: {
//                //            renderer: $.jqplot.CategoryAxisRenderer,
//                //            ticks: ticks
//                //        }, yaxis: {
//                //            padMin: 0
//                //        }
//                //    },
//                //    legend: {
//                //        show: true,
//                //        location: 'e',
//                //        placement: 'inside'
//                //    }
//                //});
//            });
//        }
//    }
//});
