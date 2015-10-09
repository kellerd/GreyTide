'use strict';

module App.Services {


    export interface IEntityManagerFactory {
        newManager(): IManagerAndMetaModels
    }
    export interface IManagerAndMetaModels {
        manager: breeze.EntityManager
        Model: Function
        ModelItem: Function
    }


    export class EntityManagerFactory {
        public static serviceId = 'entityManagerFactory';
        metadataStore: breeze.MetadataStore;
        serviceName: string;
        log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        constructor(private breeze, private config, private common: App.Shared.ICommon, private transactionScope: ITransactionScope) {
            this.setNamingConventionToCamelCase();
            this.preventValidateOnAttach();
            this.metadataStore = new breeze.MetadataStore();
            this.serviceName = config.remoteServiceName;
            this.log = common.logger.log;
            MetadataHelper.FillMetadataStore(this.metadataStore);
        }
        public newManager(): IManagerAndMetaModels {
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

            this.configureManagerToSaveModifiedItemImmediately(mgrAndModel.manager);
            this.configureConstructors(mgrAndModel);
            return mgrAndModel;
        }

        private setNamingConventionToCamelCase(): void {
            // Convert server - side PascalCase to client - side camelCase property names
            breeze.NamingConvention.none.setAsDefault();
        }

        private preventValidateOnAttach() {
            new breeze.ValidationOptions({ validateOnAttach: false }).setAsDefault();
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
                    _that.transactionScope.BeginTransaction(() => {
                        if (_model.states.length == 0 || _model.states[0].name != event) {

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
                            if (_model.parentEntity != null) {
                                var p = _model.parentEntity;
                                if (Enumerable.From(_model.parentEntity.items).Select(function (item: any) { return item.current; }).Distinct().Count() == 1) {
                                    var state: any = Enumerable.From(p.allStates).Where(function (d: any) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                    if (!(state != null)) {
                                        state.active = true;
                                        state.date = new Date().toISOString();
                                        p[event].call(p);
                                    }
                                }
                            }
                            if (_model.items != null && _model.items.length > 0)
                                Enumerable.From(_model.items).ForEach(function (p: any) {
                                    if (Enumerable.From(p.transitions()).Contains(event)) {
                                        var state: any = Enumerable.From(p.allStates).Where(function (d: any) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                        if (!(state != null)) {
                                            state.active = true;
                                            state.date = new Date().toISOString();
                                            p[event].call(p);
                                        }
                                    }
                                })

                            _model.currentState = to;
                            _model.currentDate = new Date(Date.now());
                        } else {
                            _model.allStates = Enumerable.From(_model.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(_model.states).Select(function (x: any) { return { name: x.name, active: true, date: x.date }; })).ToArray();
                        }
                        return _model;
                    });
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
        private configureManagerToSaveModifiedItemImmediately(mgr: breeze.EntityManager) {
            var _that = this;
            function saveEntity(masterEntity) {

                return mgr.saveChanges().catch(saveFailed);

                function saveFailed(error) {
                    setErrorMessage(error);
                    // Let them see it "wrong" briefly before reverting"
                    setTimeout(function () { mgr.rejectChanges(); }, 1000);
                    throw error; // so caller can see failure
                }

                function setErrorMessage(error) {
                    var statename = masterEntity.entityAspect.entityState.name.toLowerCase();
                    var typeName = masterEntity.entityType.shortName;
                    var msg = "Error saving " + statename + " " + typeName + ": ";

                    var reason = error.message;

                    if (error.entityErrors) {
                        reason = getValidationErrorMessage(error);
                    } else if (isConcurrencyError(error)) {
                        reason =
                        "can't find " + typeName + "; another user may have deleted it.";
                    }
                    _that.log(msg + reason, masterEntity, "Save changes", true);
                }

                function getValidationErrorMessage(error) {
                    try { // return the first error message
                        var firstError = error.entityErrors[0];
                        return firstError.errorMessage;
                    } catch (e) { // ignore problem extracting error message 
                        return "validation error";
                    }
                }

                function isConcurrencyError(error) {
                    var detail = error.detail;
                    return detail && detail.ExceptionMessage &&
                        detail.ExceptionMessage.match(/can't find/i);
                }
            }


            mgr.entityChanged.subscribe(function (args) {
                if (args.entityAction === breeze.EntityAction.PropertyChange) {
                    _that.transactionScope.Transaction.then(function () {
                        if (args.entity.entityAspect.entityState.isAddedModifiedOrDeleted()) {
                            var entity = args.entity;
                            var propArgs: any = args.args;
                            var propertyName = propArgs.propertyName;
                            saveEntity(entity);
                        }
                    }, function (err) { alert(err); });
                }
            });
        }


    }

    app.factory(EntityManagerFactory.serviceId,
        ['breeze', 'config', App.Shared.Common.serviceId, TransactionScope.serviceId, (b, c, cm, ts) => new EntityManagerFactory(b, c, cm, ts)]);
}