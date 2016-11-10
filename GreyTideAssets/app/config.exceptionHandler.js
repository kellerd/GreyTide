// Include in index.html so that app level exceptions are handled.
// Exclude from testRunner.html which should run exactly what it wants to run
// TS-comment: i don't make a class for this since this is extending an existing
// angular piece which is not class based
'use strict';
var App;
(function (App) {
    // Configure by setting an optional string value for appErrorPrefix.
    // Accessible via config.appErrorPrefix (via config value).
    // Extend the $exceptionHandler service to also display a toast.
    function extendExceptionHandler($delegate, config, logger) {
        var appErrorPrefix = config.appErrorPrefix;
        return function (exception, cause) {
            $delegate(exception, cause);
            if (appErrorPrefix && exception.message.indexOf(appErrorPrefix) === 0) {
                return;
            }
            var errorData = { exception: exception, cause: cause };
            var msg = appErrorPrefix + exception.message;
            logger.logError(msg, errorData, 'app', true);
        };
    }
    App.app.config(['$provide', function ($provide) {
            $provide.decorator('$exceptionHandler', ['$delegate', 'config', 'logger', extendExceptionHandler]);
        }
    ]);
})(App || (App = {}));
//# sourceMappingURL=config.exceptionHandler.js.map