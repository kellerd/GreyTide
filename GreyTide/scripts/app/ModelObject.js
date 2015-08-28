/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />

ModelObject = function (json, tideService,parent) {    // my constructor function
    this.name = json.name;
    this.points = json.points;
    this.faction = json.faction;
    var self = this;
    var existingStates = Enumerable.From(json.states).OrderByDescending(function (x) { return x.date; }).Select(function (x) { return { name: x.name, active: true, date: x.date }; });
    if (existingStates.Count() == 0)
        existingStates = Enumerable.From([{ name: "Startup", active: true, date: new Date().toISOString() }]);
    this.States = existingStates.ToArray();
    var lastState = existingStates.First();
    this[lastState.name].call(this);
    this.tideService = tideService;
    this.parent = parent;
    this.items = Enumerable.From(json.items).Select(function (p) { return new ModelObject(p, tideService, self) }).ToArray();
};
ModelObjectReplacer = function (key, value) {
    if (key == "tideService") return undefined;
    if (key == "parent") return undefined;
    else return value;
}
ModelObject.prototype = {

    //onpanic: function (event, from, to) { alert('panic'); },
    //onclear: function (event, from, to) { alert('all is clear'); },
    onafterevent: function (event, from, to) {
        this.states = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.states).Where(function (s) { return s.active })).ToArray();
        if (this.tideService != null)
            this.tideService.SaveState();
        if (this.parent != null) {
            var p = this.parent;
            if (Enumerable.From(this.parent.items).Select(function (item) { return item.current; }).Distinct().Count() == 1) {
                var state = Enumerable.From(p.states).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault();
                if (!(typeof state === 'undefined')) {
                state.active = true;
                state.date = new Date().toISOString();
                p[event].call(p);
                }
            }
        }
        if (this.items != null && this.items.length > 0)
            Enumerable.From(this.items).ForEach(function (p) {
                if (Enumerable.From(p.transitions()).Contains(event)) {
                    var state = Enumerable.From(p.states).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault();
                    if (!(typeof state === 'undefined')) {
                        state.active = true;
                        state.date = new Date().toISOString();
                        p[event].call(p);
                    }
                }
            })
    }
};
