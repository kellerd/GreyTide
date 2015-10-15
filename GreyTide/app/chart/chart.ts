'use strict';
module App.Controllers
{
    export class Chart
    {
        public static controllerId: string = 'chart';
//#region Variables
        controllerId = Chart.controllerId;
        common: App.Shared.ICommon;
        datacontext: App.Services.IDatacontext;
        log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        messageCount: number;

//#endregion
        constructor(common:App.Shared.ICommon, datacontext:App.Services.IDatacontext)
        {
            this.common = common;
            this.datacontext = datacontext;
            this.log = common.logger.log;

            // Queue all promises and wait for them to finish before loading the view
            this.activate(null);
        }

        // TODO: is there a more elegant way of activating the controller - base class?
        activate(promises: Array<ng.IPromise<any>>)
        {
            this.common.activateController(promises, this.controllerId)
                .then(() => { this.log('Activated Chart View'); });
        }

//#region Public Methods

        getLineChart = () => {
            var dc = this.datacontext;
            return dc.getTideAndState().then(data => {
                var raw = Enumerable.From(data.tide).
                    SelectMany(function (u) {

                        var orderedStates =
                            Enumerable.
                                From(u.states).
                                Where(function (s: any) { return s.name != "Startup" }).
                                OrderBy(function (s: any) { return s.date }).
                                Select(function (s: any) { return { name: s.name, date: s.date } }).
                                ToArray();
                        //Init an object with the starting state
                        var currentObject: any = dc.create("Model",
                            {
                                "id:": App.Services.GuidGenerator.newGuid(),
                                "name": u.name,
                                "points": u.points,
                                "currentState": orderedStates[0].name,
                                "states": [orderedStates[0]]
                            }, false, breeze.EntityState.Detached);
                        //Push the object through each state to select next states
                        var states =
                            Enumerable.
                                From(orderedStates).
                                Select(function (s, i) {
                                    if (i != 0)
                                        currentObject[s.name].call(currentObject);
                                    return {
                                        points: currentObject.points,
                                        date: new Date(s.date),
                                        name: currentObject.current
                                    }
                                }).
                                ToArray();
                        return Enumerable.
                            From(states).
                            SelectMany(function (s, idx) {
                                return (idx + 1) == states.length ? [s] :
                                    [s, {
                                        points: -s.points,
                                        date: new Date(states[idx + 1].date.valueOf() - 1000),
                                        name: s.name
                                    }]
                            });
                    });

                var statesOrder = Enumerable.From(data.states[0].events).ToDictionary("$.to", null);

                var dateUnion = raw.GroupBy(
                    function (s) { return new Date(s.date).setHours(0, 0, 0, 0); },
                    null,
                    function (key, d) { return { points: 0, date: key } });

                var groups = raw.GroupBy(
                    (m: any) => { return m.name; },
                    null,
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
                    OrderByDescending(function (m) {
                        return statesOrder.Contains(m.name) ? statesOrder.Get(m.name).order : -1;
                    });
                return groups.Select(function (g) { return { 'key': g.name, 'values': g.ItemsByDate }; }).ToArray();
            });
        }

        getBarChart = () => 
        {
            var dc = this.datacontext;
            return dc.getTide().then(data =>
            {
                var model = Enumerable.From(data);
                var groups = model.GroupBy(function (data) { return data.faction });
                var zeroUnion =
                    model.
                    Distinct(function (data) { return data.current }).
                    Select(function (data) { return { x: data.current, y: 0 }; });
                var d = groups.Select(function (model) {
                    return {
                        key: model.Key(),
                        values:
                        model.GroupBy(
                                    function (models) { return models.current; },
                                    null,
                                    function (key, models) {
                                            return {
                                                x: key,
                                                y: models.Select(function (d) { return d.points; }).DefaultIfEmpty(0).Sum()
                                            };
                                        }).
                                Union(zeroUnion, function (data) { return data.x }).
                                ToArray()
                    }
                }).OrderBy("$.key");
                return  d.ToArray();
            });
        }

//#endregion
    }

    // register controller with angular
    app.controller(Chart.controllerId, ['common', 'datacontext',
        (c, dc) => new App.Controllers.Chart(c, dc)
    ]);
}