'use strict';

module App.Services {


    export interface IEntityManagerFactory {
        newManager(saveEntity: SaveEntityCallback): IManagerAndMetaModels
    }
    export interface IManagerAndMetaModels {
        manager: breeze.EntityManager
        Model: Function
        ModelItem: Function
    }

    export interface SaveEntityCallback {
        (masterEntity: any): ng.IPromise<any>;
    }


    export class EntityManagerFactory {
        public static serviceId = 'entityManagerFactory';
        metadataStore: breeze.MetadataStore;
        serviceName: string;
        log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        constructor(private breeze, private config, private common: App.Shared.ICommon) {
            this.metadataStore = new breeze.MetadataStore();
            this.serviceName = config.remoteServiceName;
            this.log = common.logger.log;
            MetadataHelper.FillMetadataStore(this.metadataStore);
        }
        public newManager(saveEntity: SaveEntityCallback): IManagerAndMetaModels {
            var dataService = new breeze.DataService({
                serviceName: this.serviceName,
                hasServerMetadata: false
            });

            var mgrAndModel: IManagerAndMetaModels = {
                manager: new breeze.EntityManager({
                    dataService: dataService,
                    metadataStore: this.metadataStore
                }),
                Model: function Model() { },
                ModelItem: function ModelItem() { }
            };
            this.configureConstructors(mgrAndModel);
            return mgrAndModel;
        }


        private configureConstructors(mgr: IManagerAndMetaModels) {
            var _that = this;
            mgr.Model.prototype = {
                //onpanic: function (event, from, to) { alert('panic'); },
                //onclear: function (event, from, to) { alert('all is clear'); },
                onafterevent: function (event, from, to) {
                    handleChangeChildStates(this, event, from, to);
                }
            };
            function handleChangeChildStates(_model, event, from, to) {
                if (_model.states != undefined) {
                    var first = Enumerable.From(_model.states).OrderByDescending("$.date").Select("$.name").FirstOrDefault("");
                    if (_model.states.length == 0 || first != event) {

                        let type = <breeze.ComplexType>mgr.manager.metadataStore.getEntityType("ModelState");
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
            mgr.ModelItem.prototype = {
                //onpanic: function (event, from, to) { alert('panic'); },
                //onclear: function (event, from, to) { alert('all is clear'); },
                onafterevent: function (event, from, to) {
                    handleChangeChildStates(this, event, from, to);
                }
            };

            var ModelInitializer = function (model) {
                if (model.current == "none") model[model.currentState].call(model);
            };

            this.metadataStore.registerEntityTypeCtor('Model', mgr.Model, ModelInitializer);

            var modelItemInitializer = function (modelItem) {
                if (modelItem.current == "none") modelItem[modelItem.currentState].call(modelItem);
            };

            this.metadataStore.registerEntityTypeCtor('ModelItem', mgr.ModelItem, modelItemInitializer);
        }
    }

    app.factory(EntityManagerFactory.serviceId,
        ['breeze', 'config', App.Shared.Common.serviceId, (b, c, cm) => new EntityManagerFactory(b, c, cm)]);
}


