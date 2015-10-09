
module App.Services {
    export interface ITransactionScope {
        BeginTransaction(scope: Function): ng.IPromise<any>;
        Transaction: ng.IPromise<any>;
        Commit(): void;
    }
    export class TransactionScope implements ITransactionScope {
        public static serviceId = "TransactionScope";
        private $q: angular.IQService;
        constructor(private common: App.Shared.ICommon) {
            this.$q = common.$q;
            this.Transaction = this.$q.resolve({ "result" : true } );

        }
        public Transaction: ng.IPromise<any>;
        BeginTransaction = (scope: Function) => {
            this.Transaction = this.$q((resolve, reject) => {
                this.committed = false;
                scope();
                if (this.committed)
                    resolve({ "result": true });
                else
                    reject({ "result": false });
                this.committed = false;
            });
            return this.Transaction;
        }
        Commit = () => {
            this.committed = true;
        }
        private committed: boolean;
    }
    app.factory(TransactionScope.serviceId, ['common', (common) => new TransactionScope(common)]);
}
