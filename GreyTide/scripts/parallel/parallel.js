
var app = angular.module('greyTideApp');
app.service('responsivenessService', function ($q, $timeout) {
    var self = this;

    // Works like Underscore's map() except it uses setTimeout between each loop iteration
    // to try to keep the UI as responsive as possible
    self.responsiveMap = function (collection, evalFn) {
        var deferred = $q.defer();

        // Closures to track the resulting collection as it's built and the iteration index
        var resultCollection = [], index = 0;

        function enQueueNext() {
            $timeout(function () {
                // Process the element at "index"
                resultCollection.push(evalFn(collection[index]));

                index++;
                if (index < collection.length)
                    enQueueNext();
                else {
                    // We're done; resolve the promise
                    deferred.resolve(resultCollection);
                }
            }, 0);
        }

        // Start off the process
        enQueueNext();

        return deferred.promise;
    }

    return self;
});