'use strict';
module App.Controllers
{
    export class State
    {
        public static controllerId: string = 'state';
//#region Variables
        controllerId = State.controllerId;
        common: App.Shared.ICommon;
        datacontext: App.Services.IDatacontext;
        log: (message: string, data?: any, source?: string, showToast?: boolean) => void;
        messageCount: number;
        states: Array<any> = [];

//#endregion
        constructor(common:App.Shared.ICommon, datacontext:App.Services.IDatacontext)
        {
            this.common = common;
            this.datacontext = datacontext;
            this.log = common.logger.log;

            // Queue all promises and wait for them to finish before loading the view
            this.activate([this.getState()]);
        }

        // TODO: is there a more elegant way of activating the controller - base class?
        activate(promises: Array<ng.IPromise<any>>)
        {
            this.common.activateController(promises, this.controllerId)
                .then(() => { this.log('Activated State View'); });
        }

//#region Public Methods

        getState()
        {
            return this.datacontext.getStates().then(data =>
            {
                return this.states = data;
            });
        }

//#endregion
    }

    // register controller with angular
    app.controller(State.controllerId, ['common', 'datacontext',
        (c, dc) => new App.Controllers.State(c, dc)
    ]);
}