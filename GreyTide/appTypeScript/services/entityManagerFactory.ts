'use strict';

module App.Services {


    export interface IEntityManagerFactory {
        newManager(): IManagerAndMetaModels
    }
    export interface IManagerAndMetaModels {
        manager: breeze.EntityManager
        Model:Function
    }


    export class EntityManagerFactory {
        public static serviceId = 'entityManagerFactory';
        metadataStore: any;
        serviceName: any;

        constructor(private breeze, private config) {
            this.setNamingConventionToCamelCase();
            this.preventValidateOnAttach();
            this.metadataStore = new breeze.MetadataStore();
            this.serviceName = config.remoteServiceName;
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
                    Model:function Model() { }
            };
            
            //this.configureManagerToSaveModifiedItemImmediately(mgrAndModel.manager);
            this.configureConstructors(mgrAndModel);
            return mgrAndModel;
        }

        private setNamingConventionToCamelCase(): void {
            // Convert server - side PascalCase to client - side camelCase property names
            breeze.NamingConvention.camelCase.setAsDefault();
        }

        private preventValidateOnAttach() {
            new breeze.ValidationOptions({ validateOnAttach: false }).setAsDefault();
        }
        private configureConstructors(mgr: IManagerAndMetaModels) {
            

            mgr.Model.prototype = {
                //onpanic: function (event, from, to) { alert('panic'); },
                //onclear: function (event, from, to) { alert('all is clear'); },
                onafterevent: function (event, from, to) {
                    if (this.states.length == 0 || this.states[0].name != event) {
                        this.states.push(mgr.manager.createEntity("ModelState", { id: GuidGenerator.newGuid(), name: event, date: new Date().toISOString(), active: true, modelId: this.modelId }, breeze.EntityState.Detached));
                        this.allStates = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.states).Where(function (s:any) { return s.active })).ToArray();
                        if (this.parentEntity != null) {
                            var p = this.parentEntity;
                            if (Enumerable.From(this.parentEntity.items).Select(function (item:any) { return item.current; }).Distinct().Count() == 1) {
                                var state:any = Enumerable.From(p.allStates).Where(function (d: any) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                if (!(state !=null)) {
                                    state.active = true;
                                    state.date = new Date().toISOString();
                                    p[event].call(p);
                                }
                            }
                        }
                        if (this.items != null && this.items.length > 0)
                            Enumerable.From(this.items).ForEach(function (p:any) {
                                if (Enumerable.From(p.transitions()).Contains(event)) {
                                    var state:any= Enumerable.From(p.allStates).Where(function (d:any) { return d.active == false && d.name == event; }).FirstOrDefault(null);
                                    if (!(state != null)) {
                                        state.active = true;
                                        state.date = new Date().toISOString();
                                        p[event].call(p);
                                    }
                                }
                            })
                    } else {
                        this.allStates = Enumerable.From(this.transitions()).Select(function (x) { return { name: x, active: false, date: new Date().toISOString() }; }).Union(Enumerable.From(this.states).Where(function (s:any) { return s.active })).ToArray();
                    }
                }
            };

            var ModelInitializer = function (model) {
                model[model.currentState].call(model);
            };

            this.metadataStore.registerEntityTypeCtor('Model', mgr.Model, ModelInitializer);
        }
        private configureManagerToSaveModifiedItemImmediately(mgr: breeze.EntityManager) {
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
                    masterEntity.errorMessage(msg + reason);
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
                if (args.entityAction === breeze.EntityAction.EntityStateChange) {
                    var entity = args.entity;
                    if (entity.entityAspect.entityState.isAddedModifiedOrDeleted()) {
                        saveEntity(entity);
                    }
                }
            });
        }

        
    }

    app.factory(EntityManagerFactory.serviceId,
        ['breeze', 'config', (b, c) => new EntityManagerFactory(b, c)]);
}