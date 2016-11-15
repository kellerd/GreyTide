/// <reference path="entityMetadata.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />
/// <reference path="../../scripts/typings/linq/linq.d.ts" />
/// <reference path="../../scripts/typings/angularjs/angular.d.ts" />
'use strict';
var App;
(function (App) {
    var Services;
    (function (Services) {
        var EntityManagerFactory = (function () {
            function EntityManagerFactory(breeze, config, common) {
                this.breeze = breeze;
                this.config = config;
                this.common = common;
                this.setNamingConventionToCamelCase();
                this.preventValidateOnAttach();
                this.metadataStore = new breeze.MetadataStore();
                this.serviceName = config.remoteServiceName;
                this.log = common.logger.log;
                App.MetadataHelper.FillMetadataStore(this.metadataStore);
            }
            EntityManagerFactory.prototype.newManager = function (saveEntity) {
                var dataService = new breeze.DataService({
                    serviceName: this.serviceName,
                    hasServerMetadata: false
                });
                var mgrAndModel = {
                    manager: new breeze.EntityManager({
                        dataService: dataService,
                        metadataStore: this.metadataStore
                    }),
                    Model: function Model() { },
                    ModelItem: function ModelItem() { }
                };
                this.configureManagerToSaveModifiedItemImmediately(mgrAndModel.manager, saveEntity);
                this.configureConstructors(mgrAndModel);
                return mgrAndModel;
            };
            EntityManagerFactory.prototype.setNamingConventionToCamelCase = function () {
                // Convert server - side PascalCase to client - side camelCase property names
                breeze.NamingConvention.none.setAsDefault();
            };
            EntityManagerFactory.prototype.preventValidateOnAttach = function () {
                new breeze.ValidationOptions({ validateOnAttach: false }).setAsDefault();
            };
            EntityManagerFactory.prototype.configureConstructors = function (mgr) {
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
                            var type = mgr.manager.metadataStore.getEntityType("ModelState");
                            var newType = type.createInstance({
                                name: event,
                                date: new Date().toISOString()
                            });
                            _model.states.push(newType);
                            _model.allStates =
                                Enumerable.
                                    From(_model.transitions()).
                                    Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).
                                    Union(Enumerable.From(_model.states).
                                    Select(function (x) { return { name: x.name, active: true, date: x.date }; })).ToArray();
                            if (_model.complexAspect != null && _model.complexAspect.parent != null) {
                                var p = _model.complexAspect.parent;
                                if (Enumerable.From(p.items).Select(function (item) { return item.current; }).Distinct().Count() == 1) {
                                    var state = Enumerable.From(p.allStates).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                    if (state != null) {
                                        p[event].call(p);
                                    }
                                }
                            }
                            if (_model.items != null && _model.items.length > 0)
                                Enumerable.From(_model.items).ForEach(function (p) {
                                    if (Enumerable.From(p.transitions()).Contains(event)) {
                                        var state = Enumerable.From(p.allStates).Where(function (d) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                        if (state != null) {
                                            p[event].call(p);
                                        }
                                    }
                                });
                            _model.currentState = newType.name;
                            _model.currentDate = newType.date;
                        }
                        else {
                            _model.allStates = Enumerable.From(_model.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(_model.states).Select(function (x) { return { name: x.name, active: true, date: x.date }; })).ToArray();
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
                    if (model.current == "none")
                        model[model.currentState].call(model);
                };
                this.metadataStore.registerEntityTypeCtor('Model', mgr.Model, ModelInitializer);
                var modelItemInitializer = function (modelItem) {
                    if (modelItem.current == "none")
                        modelItem[modelItem.currentState].call(modelItem);
                };
                this.metadataStore.registerEntityTypeCtor('ModelItem', mgr.ModelItem, modelItemInitializer);
            };
            EntityManagerFactory.prototype.configureManagerToSaveModifiedItemImmediately = function (mgr, saveEntity) {
                var _that = this;
                mgr.entityChanged.subscribe(function (args) {
                    if ((args.entityAction === breeze.EntityAction.PropertyChange && (args.entity.entityAspect.entityState.isAdded() || args.entity.entityAspect.entityState.isModified())) ||
                        (args.entityAction === breeze.EntityAction.EntityStateChange && args.entity.entityAspect.entityState.isDeleted())) {
                        var entity_1 = args.entity;
                        saveEntity(entity_1).
                            then(function () { return _that.common.logger.logSuccess("Saved item", entity_1, "", true); }).
                            catch(function (reason) { return _that.common.logger.logError("Error saving item", entity_1, reason, true); });
                    }
                });
            };
            EntityManagerFactory.serviceId = 'entityManagerFactory';
            return EntityManagerFactory;
        }());
        Services.EntityManagerFactory = EntityManagerFactory;
        App.app.factory(EntityManagerFactory.serviceId, ['breeze', 'config', App.Shared.Common.serviceId, function (b, c, cm) { return new EntityManagerFactory(b, c, cm); }]);
    })(Services = App.Services || (App.Services = {}));
})(App || (App = {}));
//# sourceMappingURL=entityManagerFactory.js.map