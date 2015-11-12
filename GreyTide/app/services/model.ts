'use strict';
module App.Services {
    export class Model {
        static serviceId = 'model';
        useManualMetadata = true;
        public ModelItem = function ModelItem() { };
        public Model = function Model() { };
        private metadataStore: breeze.MetadataStore;
        constructor() {
        }

        configureMetadataStore(metadataStore: breeze.MetadataStore) {
            this.registerModel(metadataStore);
            this.registerModelItem(metadataStore);
            if (this.useManualMetadata) {
                MetadataHelper.FillMetadataStore(metadataStore);
            }
        }

        private registerModel(metadataStore: breeze.MetadataStore) {
            metadataStore.registerEntityTypeCtor('Model', this.Model, ModelInitializer);
            this.Model.prototype = {
                //onpanic: function (event, from, to) { alert('panic'); },
                //onclear: function (event, from, to) { alert('all is clear'); },
                onafterevent: function (event, from, to) {
                    this.handleChangeChildStates(this, event, from, to);
                }
            };
            var ModelInitializer = function (model) {
                if (model.current == "none") model[model.currentState].call(model);
            };
        }
        private registerModelItem(metadataStore: breeze.MetadataStore) {
            metadataStore.registerEntityTypeCtor('ModelItem', this.ModelItem, ModelItemInitializer);
            this.ModelItem.prototype = {
                //onpanic: function (event, from, to) { alert('panic'); },
                //onclear: function (event, from, to) { alert('all is clear'); },
                onafterevent: function (event, from, to) {
                    this.handleChangeChildStates(this, event, from, to);
                }
            };
            var ModelItemInitializer = function (modelItem) {
                if (modelItem.current == "none") modelItem[modelItem.currentState].call(modelItem);
            };
            
        }

        private handleChangeChildStates(_model, event, from, to) {
            if (_model.states != undefined) {
                var first = Enumerable.From(_model.states).OrderByDescending("$.date").Select("$.name").FirstOrDefault("");
                if (_model.states.length == 0 || first != event) {

                    let type = <breeze.ComplexType>this.metadataStore.getEntityType("ModelState");
                    let newType = type.createInstance(
                        {
                            name: event,
                            date: new Date().toISOString()
                        });
                    _model.states.push(newType);
                    _model.allStates =
                    Enumerable.
                        From(_model.transitions()).
                        Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).
                        Union(
                        Enumerable.From(_model.states).
                            Select(function (x: any) { return { name: x.name, active: true, date: x.date }; })
                        ).ToArray();
                    if (_model.complexAspect != null && _model.complexAspect.parent != null) {
                        var p = _model.complexAspect.parent;
                        if (Enumerable.From(p.items).Select(function (item: any) { return item.current; }).Distinct().Count() == 1) {
                            var state: any = Enumerable.From(p.allStates).Where(function (d: any) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                            if (state != null) {
                                p[event].call(p);
                            }
                        }
                    }
                    if (_model.items != null && _model.items.length > 0)
                        Enumerable.From(_model.items).ForEach(function (p: any) {
                            if (Enumerable.From(p.transitions()).Contains(event)) {
                                var state: any = Enumerable.From(p.allStates).Where(function (d: any) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                if (state != null) {
                                    p[event].call(p);
                                }
                            }
                        })

                    _model.currentState = (<any>newType).name;
                    _model.currentDate = (<any>newType).date;
                } else {
                    _model.allStates = Enumerable.From(_model.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(_model.states).Select(function (x: any) { return { name: x.name, active: true, date: x.date }; })).ToArray();
                }
            }
        }
    }

    app.factory(Model.serviceId,
        [ () => new Model()]);
}