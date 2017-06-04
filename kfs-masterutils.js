/*global define*/
define(
  [
    'jquery',
    'ng!$q',
    'js/qlik',
    'underscore',
    './properties',
    './initialproperties',
    './lib/js/enigma/enigma',
    'text!./lib/js/enigma/schema.json',
    './lib/js/extensionUtils',
    'text!./lib/partials/ngTemplate.html',
    'text!./lib/css/style.css'
  ],
  function(
    $,
    $q,
    qlik,
    _,
    props,
    initProps,
    enigma,
    qixSchema,
    extensionUtils,
    ngTemplate,
    cssContent
  ) {
    'use strict';
    extensionUtils.addStyleToHeader(cssContent);

    console.log('Initializing - remove me');

    return {
      definition: props,

      initialProperties: initProps,

      snapshot: { canTakeSnapshot: true },

      resize: function(/*$element, layout*/) {
        //do nothing
      },

      template: ngTemplate,

      controller: [
        '$scope',
        '$window',
        function($scope, $window) {
          $scope.app = qlik.currApp();
          $scope.enigma = enigma;
          $scope.data;

          $scope.importTextarea = '';
          $scope.importTextareaPlaceholder = 'qId;qType;qName;qExpression;qDescription;qLabel;qGrouping;qTags;qColor';

          $scope.getMasterItemDefinition = function(row, qType) {
            switch (qType.toLowerCase()) {
              case 'dimension':
                return $scope.getDimensionDefinition(row);

              case 'measure':
                return $scope.getMeasureDefinition(row);

              default:
                console.error('qType of row is not valid');
                break;
            }
          };
          $scope.getMeasureDefinition = function(row) {
            var measure = {
              qInfo: {
                qType: 'measure'
              },
              qMeasure: {
                qLabel: row[5].qText,
                qDef: row[3].qText,
                qGrouping: row[6].qText,
                qExpressions: [],
                qActiveExpression: 0
              },
              qMetaDef: {
                title: row[2].qText,
                description: row[4].qText == '' ? row[2].qText : row[4].qText,
                qSize: -1,
                sourceObject: '',
                draftObject: '',
                tags: row[7].qText ? row[7].qText.split(',') : []
              }
            };

            if (
              row[8].qText !== undefined &&
              row[8].qText !== '' &&
              row[8].qText !== null &&
              row[8].qText !== '-'
            ) {
              measure.qMeasure.baseColor = { color: row[8].qText, index: -1 };
            }

            if (
              row[0].qText !== undefined &&
              row[0].qText !== '' &&
              row[0].qText !== null &&
              row[0].qText !== '-'
            ) {
              measure.qInfo = {
                qId: row[0].qText,
                qType: measure.qInfo.qType
              };
            }
            return measure;
          };
          $scope.getDimensionDefinition = function(row) {
            var dimension = {
              qInfo: {
                qType: 'dimension'
              },
              qDim: {
                qGrouping: row[6].qText,
                qFieldDefs: row[6].qText === 'H'
                  ? row[3].qText.split(',')
                  : [row[3].qText],
                qFieldLabels: [row[2].qText]
              },
              qMetaDef: {
                title: row[2].qText,
                description: row[4].qText == '' ? row[2].qText : row[4].qText,
                qSize: -1,
                sourceObject: '',
                draftObject: '',
                tags: row[7].qText ? row[7].qText.split(',') : []
              }
            };

            if (
              row[0].qText !== undefined &&
              row[0].qText !== '' &&
              row[0].qText !== null &&
              row[0].qText !== '-'
            ) {
              dimension.qInfo = {
                qId: row[0].qText,
                qType: dimension.qInfo.qType
              };
            }
            return dimension;
          };

          $scope.createDimension = function(dimension) {
            var objId = dimension.qInfo.qId;
            return $scope.qix.app.getDimension(objId).then(function(dim) {
              if (dim === null) {
                console.log('Dim: ' + objId + ' does not exist.  Creating', {
                  module: 'createDimension',
                  dimension: dimension
                });
                return $scope.qix.app
                  .createDimension(dimension)
                  .then(function(newDimension) {
                    console.log('Dim: ' + objId + ' Created', {
                      module: 'createDimension',
                      dimension: newDimension
                    });
                    return newDimension.getLayout().then(function(layout) {
                      console.log('layout new dim', layout);
                    });
                  });
              } else {
                return dim.getProperties().then(function(currentProps) {
                  console.log(
                    'Dim: ' + objId + ' exists.  Checking for changes.',
                    {
                      module: 'createDimension',
                      dimension: dimension,
                      currentProps: currentProps
                    }
                  );
                  if (
                    JSON.stringify(currentProps) === JSON.stringify(dimension)
                  ) {
                    console.log('Dim: ' + objId + ' no changes found.', {
                      module: 'createDimension',
                      dimension: dimension
                    });
                  } else {
                    console.log(
                      'Dim: ' + objId + ' found changes.  Setting properties.',
                      { module: 'createDimension', dimension: dimension }
                    );
                    return dim.setProperties(dimension).then(function() {
                      console.log('Dim: ' + objId + ' new properties set.', {
                        module: 'createDimension',
                        dimension: dimension
                      });
                    });
                  }
                });
              }
            });
          };

          $scope.createMeasure = function(measure) {
            var objId = measure.qInfo.qId;
            return $scope.qix.app
              .getMeasure(objId)
              .then(function(measureModel) {
                if (measureModel === null) {
                  console.log(
                    'Measure: ' + objId + ' does not exist.  Creating',
                    {
                      module: 'createMeasure',
                      measure: measure
                    }
                  );
                  return $scope.qix.app
                    .createMeasure(measure)
                    .then(function(newMeasure) {
                      console.log('Measure: ' + objId + ' Created', {
                        module: 'createMeasure',
                        measure: newMeasure
                      });
                      return newMeasure.getLayout().then(function(layout) {
                        console.log('layout new measure', layout);
                      });
                    });
                } else {
                  return measureModel
                    .getProperties()
                    .then(function(currentProps) {
                      console.log(
                        'Measure: ' + objId + ' exists.  Checking for changes.',
                        {
                          module: 'createMeasure',
                          measure: measure,
                          currentProps: currentProps
                        }
                      );
                      if (
                        JSON.stringify(currentProps) === JSON.stringify(measure)
                      ) {
                        console.log(
                          'Measure: ' + objId + ' no changes found.',
                          {
                            module: 'createMeasure',
                            measure: measure
                          }
                        );
                      } else {
                        console.log(
                          'Measure: ' +
                            objId +
                            ' found changes.  Setting properties.',
                          { module: 'createMeasure', measure: measure }
                        );
                        return measureModel
                          .setProperties(measure)
                          .then(function() {
                            console.log(
                              'Measure: ' + objId + ' new properties set.',
                              {
                                module: 'createMeasure',
                                measure: measure
                              }
                            );
                          });
                      }
                    });
                }
              });
          };

          $scope.updateMasterItems = function(data) {
            console.log('updateMasterItems', $scope);
            if (!data) {
              data = $scope.data;
            }

            _.each(data, function(item) {
              if (item.qDim) {
                $scope
                  .createDimension(item)
                  .then(function(reply) {
                    console.log('reply', reply);
                  })
                  .catch(function(err) {
                    console.log('err', err);
                  });
              } else if (item.qMeasure) {
                $scope
                  .createMeasure(item)
                  .then(function(reply) {
                    console.log('reply', reply);
                  })
                  .catch(function(err) {
                    console.log('err', err);
                  });
              }
            });
          };

          $scope.getDimensionList = function() {
            var dimensionListDef = {
              qInfo: {
                qType: 'DimensionList'
              },
              qDimensionListDef: {
                qType: 'dimension',
                qData: {
                  title: '/title',
                  tags: '/tags'
                }
              }
            };

            return $scope.qix.app
              .createSessionObject(dimensionListDef)
              .then(function(dimensionList) {
                console.log('dimensionList', dimensionList);
                return dimensionList
                  .getLayout()
                  .then(function(dimensionListLayout) {
                    console.log('dimensionListLayout', dimensionListLayout);
                    return dimensionListLayout;
                  });
              });
          };

          $scope.getMeasureList = function() {
            var measureListDef = {
              qInfo: {
                qType: 'MeasureList'
              },
              qMeasureListDef: {
                qType: 'measure',
                qData: {
                  title: '/title',
                  tags: '/tags'
                }
              }
            };

            return $scope.qix.app
              .createSessionObject(measureListDef)
              .then(function(measureList) {
                console.log('measureList', measureList);
                return measureList
                  .getLayout()
                  .then(function(measureListLayout) {
                    console.log('measureListLayout', measureListLayout);
                    return measureListLayout;
                  });
              });
          };

          $scope.convertArrayOfObjectsToCSV = function(args) {
            var result, ctr, keys, columnDelimiter, lineDelimiter, data;

            data = args.data || null;
            if (data == null || !data.length) {
              return null;
            }

            columnDelimiter = args.columnDelimiter || ';';
            lineDelimiter = args.lineDelimiter || '\n';

            keys = Object.keys(data[0]);

            result = '';
            result += keys.join(columnDelimiter);
            result += lineDelimiter;

            data.forEach(function(item) {
              ctr = 0;
              keys.forEach(function(key) {
                if (ctr > 0) result += columnDelimiter;

                result += item[key];
                ctr++;
              });
              result += lineDelimiter;
            });

            if (result.lastIndexOf('\n') > 0) {
              result = result.substring(0, result.lastIndexOf('\n'));
            }
            return result;
          };

          $scope.downloadArrayAsCSV = function(args) {
            var data, filename, link;
            var csv = $scope.convertArrayOfObjectsToCSV(args);
            if (csv == null) return;

            filename = args.filename || 'export.csv';

            if (!csv.match(/^data:text\/csv/i)) {
              csv = 'data:text/csv;charset=utf-8,' + csv;
            }
            data = encodeURI(csv);

            link = document.createElement('a');
            link.setAttribute('href', data);
            link.setAttribute('download', filename);
            link.click();
          };

          $scope.exportMasterItemsToCsv = function() {
            let promises = [];
            $scope.getDimensionList().then(function(reply) {
              _.each(reply.qDimensionList.qItems, function(item) {
                promises.push(
                  $scope.qix.app
                    .getDimension(item.qInfo.qId)
                    .then(function(dimension) {
                      return dimension
                        .getProperties()
                        .then(function(properties) {
                          console.log('exporting dimension props:', properties);
                          return {
                            qId: properties.qInfo.qId,
                            qType: properties.qInfo.qType,
                            qName: properties.qMetaDef.title,
                            qExpression: properties.qDim.qFieldDefs.join(','),
                            qDescription: properties.qMetaDef.description,
                            qLabel: properties.qDim.qFieldLabels[0],                            
                            qGrouping: properties.qDim.qGrouping,
                            qTags: properties.qMetaDef.tags
                              ? properties.qMetaDef.tags.join(',')
                              : '',
                            qColor: ''
                          };
                        });
                    })
                );
              });
              $scope.getMeasureList().then(function(reply) {
                _.each(reply.qMeasureList.qItems, function(item) {
                  console.log('exporting Measure:', item);
                  promises.push(
                    $scope.qix.app
                      .getMeasure(item.qInfo.qId)
                      .then(function(measure) {
                        return measure
                          .getProperties()
                          .then(function(properties) {
                            console.log('exporting measure props:', properties);
                            return {
                              qId: properties.qInfo.qId,
                              qType: properties.qInfo.qType,
                              qName: properties.qMetaDef.title,
                              qExpression: properties.qMeasure.qDef,
                              qDescription: properties.qMetaDef.description,
                              qLabel: properties.qMeasure.qLabel,                              
                              qGrouping: properties.qMeasure.qGrouping,
                              qTags: properties.qMetaDef.tags
                                ? properties.qMetaDef.tags.join(',')
                                : '',
                              qColor: properties.qMeasure.baseColor
                                ? properties.qMeasure.baseColor.color
                                : ''
                            };
                          });
                      })
                  );
                });
                $q.all(promises).then(function(data) {
                  console.log(data);
                  $scope.downloadArrayAsCSV({
                    data: data,
                    filename: 'qMasterItems.csv'
                  });
                });
              });
            });
          };

          $scope.exportDimensionsToCsv = function() {
            console.log('exportDimensionsToCsv');
            $scope.getDimensionList().then(function(reply) {
              console.log('reply dimensionListLayout', reply);
              let promises = _.map(reply.qDimensionList.qItems, function(item) {
                console.log('exporting dimension:', item);
                return $scope.qix.app
                  .getDimension(item.qInfo.qId)
                  .then(function(dimension) {
                    return dimension.getProperties().then(function(properties) {
                      console.log('exporting dimension props:', properties);
                      return {
                        qId: properties.qInfo.qId,
                        qType: properties.qInfo.qType,
                        qName: properties.qMetaDef.title,
                        qExpression: properties.qDim.qFieldDefs.join(','),
                        qDescription: properties.qMetaDef.description,
                        qLabel: properties.qDim.qFieldLabels[0],
                        qTags: properties.qMetaDef.tags
                          ? properties.qMetaDef.tags.join(',')
                          : '',
                        qGrouping: properties.qDim.qGrouping
                      };
                    });
                  });
              });

              $q.all(promises).then(function(data) {
                console.log(data);
                $scope.downloadArrayAsCSV({
                  data: data,
                  filename: 'qDimensions.csv'
                });
              });
            });
          };

          $scope.inputIsValid = function () {
            return $scope.importTextarea.substring(0,$scope.importTextareaPlaceholder.length) === $scope.importTextareaPlaceholder;
          }

          $scope.importToMasterLibrary = function () {
            console.log('$scope.importTextarea',$scope.importTextarea);
            $scope.updateMasterItems($scope.getDataFromTextarea());
          }

          $scope.exportMeasuresToCsv = function() {
            console.log('exportMeasuresToCsv');
            $scope.getMeasureList().then(function(reply) {
              console.log('reply MeasureListLayout', reply);
              let promises = _.map(reply.qMeasureList.qItems, function(item) {
                console.log('exporting Measure:', item);
                return $scope.qix.app
                  .getMeasure(item.qInfo.qId)
                  .then(function(measure) {
                    return measure.getProperties().then(function(properties) {
                      console.log('exporting measure props:', properties);
                      return {
                        qId: properties.qInfo.qId,
                        qType: properties.qInfo.qType,
                        qName: properties.qMetaDef.title,
                        qExpression: properties.qMeasure.qDef,
                        qDescription: properties.qMetaDef.description,
                        qLabel: properties.qMeasure.qLabel,
                        qTags: properties.qMetaDef.tags
                          ? properties.qMetaDef.tags.join(',')
                          : '',
                        qGrouping: properties.qMeasure.qGrouping,
                        qColor: properties.qMeasure.baseColor
                          ? properties.qMeasure.baseColor.color
                          : ''
                      };
                    });
                  });
              });

              $q.all(promises).then(function(data) {
                console.log(data);
                $scope.downloadArrayAsCSV({
                  data: data,
                  filename: 'qMeasures.csv'
                });
              });
            });
          };

          $scope.deleteDimensionsAndMeasures = function() {
            console.log('deleteDimensionsAndMeasures');
            $scope.deleteDimensions();
            $scope.deleteMeasures();
          };

          $scope.deleteDimensions = function() {
            console.log('deleteDimensions');
            $scope.getDimensionList().then(function(reply) {
              console.log('reply dimensionListLayout', reply);
              _.map(reply.qDimensionList.qItems, function(dimension) {
                console.log('destroying dimension:', dimension);
                $scope.qix.app.destroyDimension(dimension.qInfo.qId);
              });
            });
          };

          $scope.deleteMeasures = function() {
            console.log('deleteMeasures');
            $scope.getMeasureList().then(function(reply) {
              console.log('reply measureListLayout', reply);
              _.map(reply.qMeasureList.qItems, function(measure) {
                console.log('destroying measure:', measure);
                $scope.qix.app.destroyMeasure(measure.qInfo.qId);
              });
            });
          };

          $scope.setData = function(layout) {
            var data = _.map(layout.qHyperCube.qDataPages[0].qMatrix, function(
              row
            ) {
              return $scope.getMasterItemDefinition(row, row[1].qText);
            });

            var filteredData = _.filter(data, function(item) {
              if (item === undefined) {
                return false;
              }
              return item.qDim || item.qMeasure;
            });

            $scope.data = filteredData;
            console.log('$scope.data', $scope.data);
          };

          $scope.getDataFromTextarea = function() {
            var pastedData = $scope.importTextarea.split('\n').slice(1);
            var data = _.map(pastedData, function(
              stringRow
            ) {
              var row = _.map(stringRow.split(';'), function(item) {
                return {qText: item}
              })
              return $scope.getMasterItemDefinition(row, row[1].qText);
            });

            var filteredData = _.filter(data, function(item) {
              if (item === undefined) {
                return false;
              }
              return item.qDim || item.qMeasure;
            });
            return filteredData;
          };

          var enigmaConfig = {
            Promise: $q,
            appId: $scope.app.id,
            schema: JSON.parse(qixSchema),
            session: {
              host: $window.location.host,
              secure: $window.location.protocol === 'https:'
            }
          };
          enigma.getService('qix', enigmaConfig).then(function(qix) {
            console.log('qix', qix);
            $scope.qix = qix;
          });
        }
      ],

      paint: function($element, layout) {
        console.groupCollapsed('Basic Objects');
        console.info('$element:');
        console.log($element);
        console.info('layout:');
        console.log(layout);
        console.info('this:');
        console.log(this);
        console.groupEnd();

        var lastrow = 0;
        var _this = this;
        //loop through the rows we have and render
        _this.backendApi.eachDataRow(function(rownum) {
          lastrow = rownum;
        });
        if (_this.backendApi.getRowCount() > lastrow + 1) {
          //we havent got all the rows yet, so get some more, 1000 rows
          var requestPage = [
            {
              qTop: lastrow + 1,
              qLeft: 0,
              qWidth: 9,
              qHeight: Math.min(1000, this.backendApi.getRowCount() - lastrow)
            }
          ];
          _this.backendApi.getData(requestPage).then(function() {
            _this.paint($element);
          });
        } else {
          console.log('all rows fetched');
          _this.$scope.setData(layout);
        }
      }
    };
  }
);
