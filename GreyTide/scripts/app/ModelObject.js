/// <reference path="../linq-vsdoc.js" />
/// <reference path="../linq.min.js" />

ModelObject = function (json, tideService,parent) {    // my constructor function
    this.name = json.name;
    this.points = json.points;
    this.faction = json.faction;
    var self = this;
    var existingStates = Enumerable.From(json.States).OrderByDescending(function (x) { return x.date; }).Select(function (x) { return { name: x.name, active: true, date: x.date }; });
    if (existingStates.Count() == 0)
        existingStates = Enumerable.From([{ name: "Startup", active: true, date: new Date().toISOString() }]);
    this.States = existingStates.ToArray();
    var lastState = existingStates.First();
    this[lastState.name].call(this);
    this.tideService = tideService;
    this.parent = parent;
    this.Pieces = Enumerable.From(json.Pieces).Select(function (p) { return new ModelObject(p, tideService, self) }).ToArray();
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
        this.States = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.States).Where(function (s) { return s.active })).ToArray();
        if (this.tideService != null)
            this.tideService.SaveState();
        if (this.parent != null) {
            var p = this.parent;
            if (Enumerable.From(this.parent.Pieces).Select(function (piece) { return piece.current; }).Distinct().Count() == 1) {
                var state = Enumerable.From(p.States).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault();
                if (!(typeof state === 'undefined')) {
                state.active = true;
                state.date = new Date().toISOString();
                p[event].call(p);
                }
            }
        }
        if (this.Pieces != null && this.Pieces.length > 0)
            Enumerable.From(this.Pieces).ForEach(function (p) {
                if (Enumerable.From(p.transitions()).Contains(event)) {
                    var state = Enumerable.From(p.States).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault();
                    if (!(typeof state === 'undefined')) {
                        state.active = true;
                        state.date = new Date().toISOString();
                        p[event].call(p);
                    }
                }
            })
    }
};
