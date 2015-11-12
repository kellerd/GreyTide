'use strict';

module App.Services {


    export interface IEntityManagerFactory {
        newManager(saveEntity: SaveEntityCallback): breeze.EntityManager
    }
    export interface SaveEntityCallback {
        (masterEntity: any): ng.IPromise<any>;
    }


    export class EntityManagerFactory {
        public static serviceId = 'entityManagerFactory';
        metadataStore: breeze.MetadataStore;
        serviceName: string;
        log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        constructor(private breeze, private config, private common: App.Shared.ICommon, private model: App.Services.Model) {
            this.metadataStore = new breeze.MetadataStore();
            this.serviceName = config.remoteServiceName;
            this.log = common.logger.log;
        }
        public newManager(saveEntity: SaveEntityCallback): breeze.EntityManager {
            var dataService = new breeze.DataService({
                serviceName: this.serviceName,
                hasServerMetadata: false
            });

            var mgr: breeze.EntityManager =  new breeze.EntityManager({
                    dataService: dataService,
                    metadataStore: this.metadataStore
                });
            this.configureConstructors();
            return mgr;
        }


        private configureConstructors() {
            this.model.configureMetadataStore(this.metadataStore);
        }
    }

    app.factory(EntityManagerFactory.serviceId,
        ['breeze', 'config', App.Shared.Common.serviceId, App.Services.Model.serviceId, (b, c, cm, m) => new EntityManagerFactory(b, c, cm,m)]);
}


