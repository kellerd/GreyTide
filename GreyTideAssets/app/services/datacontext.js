/// <reference path="entityManagerFactory.ts" />
/// <reference path="../../scripts/typings/breeze/breeze.d.ts" />
/// <reference path="../../scripts/typings/statemachine/statemachine.d.ts" />
/// <reference path="../app.ts" />
/// <reference path="../config.ts" />
/// <reference path="../common/logger.ts" />
'use strict';
var App;
(function (App) {
    var Services;
    (function (Services) {
        var Datacontext = (function () {
            function Datacontext(common, entityManagerFactory, config) {
                var _this = this;
                this.common = common;
                this.config = config;
                this.saveEntity = function (masterEntity) {
                    //_that.common.debouncedThrottle("entityChanges", function () {
                    //    saveEntity(entity);
                    //    _that.common.logger.log("Saved item", entity, "", true);
                    //    return true;
                    //}
                    //        }, 300, false);
                    var _that = _this;
                    return _that.common.queuePromise("entityChanges", function () {
                        return _that.manager.manager.saveChanges().catch(saveFailed);
                    }, 0, true);
                    function saveFailed(error) {
                        setErrorMessage(error);
                        // Let them see it "wrong" briefly before reverting"
                        setTimeout(function () { _that.manager.manager.rejectChanges(); }, 1000);
                        throw error; // so caller can see failure
                    }
                    function setErrorMessage(error) {
                        var statename = masterEntity.entityAspect.entityState.name.toLowerCase();
                        var typeName = masterEntity.entityType.shortName;
                        var msg = "Error saving " + statename + " " + typeName + ": ";
                        var reason = error.message;
                        if (error.entityErrors) {
                            reason = getValidationErrorMessage(error);
                        }
                        else if (isConcurrencyError(error)) {
                            reason =
                                "can't find " + typeName + "; another user may have deleted it.";
                        }
                        _that.common.logger.log(msg + reason, masterEntity, "Save changes", true);
                    }
                    function getValidationErrorMessage(error) {
                        try {
                            var firstError = error.entityErrors[0];
                            return firstError.errorMessage;
                        }
                        catch (e) {
                            return "validation error";
                        }
                    }
                    function isConcurrencyError(error) {
                        var detail = error.detail;
                        return detail && detail.ExceptionMessage &&
                            detail.ExceptionMessage.match(/can't find/i);
                    }
                };
                this.getFailed = function (error) {
                    var msg = _this.config.appErrorPrefix + "Error retrieving states: " + error.message;
                    _this.common.logger.logError(msg, null, error, true);
                    throw error;
                };
                this.$q = common.$q;
                this.logger = common.logger;
                this.EntityQuery = breeze.EntityQuery;
                this.manager = entityManagerFactory.newManager(this.saveEntity);
            }
            Datacontext.prototype.create = function (localModelName, initialValues, isComplexType, entityState, mergeStrategy) {
                if (isComplexType) {
                    var type = this.manager.manager.metadataStore.getEntityType(localModelName);
                    return type.createInstance(initialValues);
                }
                return this.manager.manager.createEntity(localModelName, initialValues, entityState, mergeStrategy);
            };
            Datacontext.prototype.getTide = function () {
                var _this = this;
                var tide;
                var getSucceeded = function (data) {
                    tide = data.results;
                    _this.logger.logSuccess("Retrieved [Models] from remote data source", tide.length, null, true);
                    return tide;
                };
                return this.EntityQuery.from("Models")
                    .using(this.manager.manager).execute()
                    .then(getSucceeded)
                    .catch(this.getFailed);
            };
            Datacontext.prototype.getStates = function () {
                var _this = this;
                var states;
                var getSucceeded = function (data) {
                    states = data.results;
                    _this.common.logger.log("Retrieved [States] from remote data source", states.length, null, true);
                    return states;
                };
                return this.EntityQuery.from("States")
                    .using(this.manager.manager).execute()
                    .then(getSucceeded)
                    .catch(this.getFailed);
            };
            Datacontext.prototype.getTideAndState = function () {
                return this.$q.all([this.getStates(), this.getTide()]).then(function (dataArray) {
                    return { states: dataArray[0], tide: dataArray[1] };
                });
            };
            Datacontext.prototype.prime = function () {
                var _this = this;
                this.getStates().then(function (data) {
                    var events = data[0].events.map(function (e) {
                        return {
                            name: e.name,
                            from: e.from,
                            to: e.to
                        };
                    });
                    StateMachine.create({
                        target: _this.manager.Model.prototype,
                        initial: { state: 'None', event: 'init', defer: true },
                        events: events
                    });
                    StateMachine.create({
                        target: _this.manager.ModelItem.prototype,
                        initial: { state: 'None', event: 'init', defer: true },
                        events: events
                    });
                    _this.common.logger.log("States primed", null, "", true);
                }, function (error) {
                    _this.common.logger.logError(error, null, Datacontext.serviceId, true);
                });
            };
            Datacontext.serviceId = 'datacontext';
            return Datacontext;
        }());
        Services.Datacontext = Datacontext;
        // Register with angular
        App.app.factory(Datacontext.serviceId, ['common', Services.EntityManagerFactory.serviceId, 'config', function (common, entityManagerFactory, config) { return new Datacontext(common, entityManagerFactory, config); }]);
    })(Services = App.Services || (App.Services = {}));
})(App || (App = {}));
//# sourceMappingURL=datacontext.js.map