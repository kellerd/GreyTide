
/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />
/// <reference path="../angular.js" />
/// <reference path="../d3/d3.js" />
/// <reference path="../nv.d3.js" />
var app = angular.module('greyTideApp');


app.directive('chartbar', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, el, attrs) {

            //angular.element(document).ready(function () {

                var model = Enumerable.From(scope.Tide.Items);
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
            //});
        }
    }
});


app.directive('chartline', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, el, attrs) {

            // set up slider on load
           // angular.element(document).ready(function () {

                var raw = Enumerable.From(scope.Tide.Items).
                    SelectMany(function (u) {

                        var orderedStates = Enumerable.From(u.States).Where(function (s) { return s.name != "Startup" && s.active }).
                        					                   OrderBy(function (s) { return s.date });
                        var currentObject = new ModelObject({
                            "name": u.name,
                            "points": u.points,
                            "States": [orderedStates.First()]
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

                var statesOrder = Enumerable.From(scope.States.model[0].events).ToDictionary("$.to");

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

           // });
        }
    }
});

