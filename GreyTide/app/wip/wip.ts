'use strict';
module App.Controllers {
    export class Wip {
        public static controllerId: string = 'wip';

        predicate = '';
        reverse = false;
        title = 'Work In Progress';
        wip = [];
        isDeleting: boolean;

        constructor(private $scope: ng.IScope, private $location: ng.ILocationService, private bsDialog: App.Shared.IBootstrapDialog, private common: App.Shared.ICommon, private config: App.IConfigurations, private datacontext:App.Services.Datacontext) {
            activate();

            function activate() {
                common.activateController([this.getWipSummary()], Wip.controllerId);

                $scope.$on(config.events.storage.wipChanged, function (event, data) {
                    this.wip = data;
                });
            }

            

           
        }
        private getWipSummary() { return this.common.$q.when(this.datacontext.zStorageWip.getWipSummary()).then((data) => { this.wip = data); }
        gotoWip(wipData) {
            this.$location.path('/' + wipData.routeState + '/' + wipData.key);
        }
        cancelAllWip() {
            this.isDeleting = true;

            return this.bsDialog.deleteDialog('Work in Progress')
                .then(confirmDelete, cancelDelete);

            function cancelDelete() { this.isDeleting = false; }

            function confirmDelete() {
                this.datacontext.zStorageWip.clearAllWip();
                this.isDeleting = false;
            }
        }
        setSort(prop) {
            this.predicate = prop;
            this.reverse = !this.reverse;
        }
    }


    app.controller(Wip.controllerId,
        ['$scope', '$location',
            'bootstrap.dialog', 'common', 'config', 'datacontext',
            ($scope, $location, bsDialog, common, config, datacontext) => new App.Controllers.Wip($scope, $location, bsDialog, common, config, datacontext)
    ]);
}