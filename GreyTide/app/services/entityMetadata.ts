﻿'use strict';
module App {
    export class MetadataHelper {
        public static FillMetadataStore(store) {

            // Metadata-Helper instance configured with default namespace and key generator for this model
            var helper = new breeze.config.MetadataHelper('GreyTide.Models', breeze.AutoGeneratedKeyType.Identity);
            // DataTypes
            var DT = breeze.DataType;
            var BOOL = DT.Boolean;
            var DATE = DT.DateTime;
            var ID = DT.Int32;
            var GUID = DT.Guid;
            var STRING = DT.String;

            // type order is irrelevant
            addModel();
            addModelState();
            addStateCollection();
            addState();
            addModelItems();
            // addType - make it easy to add the type to the store using the helper
            function addType(type) {
                helper.addTypeToStore(store, type);
            };

            function addModel() {
                addType({
                    name: 'Model',
                    dataProperties: {
                        
                        id: { type: GUID, required: true },
                        name: { type: STRING, required: true },
                        currentState: { type: STRING },
                        currentDate: { type: DATE },
                        faction: { type: STRING },
                        points: { type: ID },
                        type: { type: STRING },
                        states: { complexTypeName: 'ModelState', required: true, isScalar: false },
                        items: { complexTypeName: 'ModelItem', isScalar: false }
                    }
                });
            };
            function addModelItems() {
                addType({
                    name: 'ModelItem',
                    isComplexType: true,
                    dataProperties: {
                        name: { type: STRING, required: true },
                        currentState: { type: STRING },
                        currentDate: { type: DATE },
                        points: { type: ID },
                        states: { complexTypeName: 'ModelState', required: true, isScalar: false }
                    }
                });
            };
            function addModelState() {
                addType({
                    name: 'ModelState',
                    isComplexType: true,
                    dataProperties: {
                        name: { type: STRING, required: true },
                        date: { type: DATE, required: true }
                    }
                });
            };
            function addState() {
                addType({
                    name: 'State',
                    isComplexType: true,
                    dataProperties: {
                        order: { type: ID, required: true },
                        name: { type: STRING, required: true },
                        to: { type: STRING, required: true },
                        from: { type: STRING, required: true, isScalar: false }
                    }
                });
            };
            function addStateCollection() {
                addType({
                    name: 'StateCollection',
                    dataProperties: {
                        
                        id: { type: GUID, required: true },
                        name: { type: STRING, required: true },
                        type: { type: STRING },
                        events: { complexTypeName: 'State', required: true }
                    }
                });
            };
        }
    }
} 