'use strict';
module App.Controllers
{
    export class Tide
    {
        public static controllerId: string = 'tide';
//#region Variables
        controllerId = Tide.controllerId;
        common: App.Shared.ICommon;
        datacontext: App.Services.IDatacontext;
        log: any;
        messageCount: number;
        tide: Array<any> = [];

//#endregion
        constructor(common, datacontext)
        {
            this.common = common;
            this.datacontext = datacontext;
            this.log = common.logger.getLogFn();

            // Queue all promises and wait for them to finish before loading the view
            this.activate([this.getTide()]);
        }

        // TODO: is there a more elegant way of activating the controller - base class?
        activate(promises: Array<ng.IPromise<any>>)
        {
            this.common.activateController(promises, this.controllerId)
                .then(() => { this.log('Activated Tide View'); });
        }

//#region Public Methods

        getTide()
        {
            return this.datacontext.getTide().then(data =>
            {
                return this.tide = data;
            });
        }

//#endregion
    }

    // register controller with angular
    app.controller(Tide.controllerId, ['common', 'datacontext',
        (c, dc) => new App.Controllers.Tide(c, dc)
    ]);
}