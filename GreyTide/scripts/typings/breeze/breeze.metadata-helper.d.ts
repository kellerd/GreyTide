﻿
declare module breeze.config {
    class MetadataHelper {
        addDataService: Function;
        addTypeNameAsResource: Function;
        addTypeToStore: Function;
        convertValidators: Function;
        findEntityKey: Function;
        inferDefaultResourceName: Function;
        inferValidators: Function;
        patch: Function;
        pluralize: Function;
        replaceDataPropertyAliases: Function;
        replaceNavPropertyAliases: Function;
        setDefaultAutoGeneratedKeyType: Function;
        setDefaultNamespace: Function;
        _hasOwnProperty: Function;
        _isArray: Function;
        constructor(collection: string,keyType:breeze.AutoGeneratedKeyType);
    }

}