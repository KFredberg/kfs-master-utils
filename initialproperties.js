/*global define*/
define([], function() {
  'use strict';
  var qDimensions = [
    {
      qDef: {
        qFieldDefs: ['=qId'],
        qFieldLabels: ['']
      }
    },
    {
      qDef: {
        qFieldDefs: ['=qType'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qName'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qExpression'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qDescription'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qLabel'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qGrouping'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qTags'],
        qFieldLabels: ['']
      }
    },
     {
      qDef: {
        qFieldDefs: ['=qColor'],
        qFieldLabels: ['']
      }
    },
  ];

  return {
    qHyperCubeDef: {
      qDimensions: qDimensions,
      qInitialDataFetch: [
        {
          qWidth: 9,
          qHeight: 1000
        }
      ]
    }
  };
});
