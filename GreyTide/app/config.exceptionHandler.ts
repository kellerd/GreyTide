'use strict';
module App
{
    function configBreeze() {
        // Convert server - side PascalCase to client - side camelCase property names
        breeze.NamingConvention.none.setAsDefault();
        new breeze.ValidationOptions({ validateOnAttach: false }).setAsDefault();
    }
    app.config([configBreeze]);
}
