/**
 * Created by lab on 09/09/15.
 */
"use strict";

var app = angular.module("app", ['ngPapaParse', 'ui.select', 'ngSanitize', 'ngAnimate', 'ui.bootstrap', 'ui.bootstrap.collapse','ngOboe']);

app.service('neo4jQueryBuilder', [function() {
     return function(queryObject) {
       var api = {
         getDomains: getDomains,
         getMultiSelectionDomains: getMultiSelectionDomains,
         getSelectionDomains: getSelectionDomains
       };
       var statmentTable = {
         sp: "MATCH (sp:SWISSProt)-[r:MAPPED]-(p:PDBChain)-[:MAPPED]-(d:ECODDomain) WHERE sp.id = { id } AND (d)-[:DISTANCE]-() AND  ( (({start}+{end})< 0) XOR (r.spStart <= {start} AND r.spEnd >= {end}) ) return id(d)",
         pdb: "MATCH MATCH (p:PDBEntry)-[:SUBCHAIN]-(:PDBChain)-[:MAPPED]-(d:ECODDomain) where p.id = { id } return id(d)",
         pdbc: "MATCH (c:PDBChain)-[r:MAPPED]-(d:ECODDomain) WHERE c.id = { id } AND (d)-[:DISTANCE]-() AND  ( (({start}+{end})< 0) XOR (r.seqidStart <= {start} AND r.seqidEnd >= {end}) ) return id(d)",
         ecod: "MATCH (d:ECODDomain) WHERE d.id = {id} return id(d)"
       };
       return api;

       function getDomains() {
         var statmentString = "MATCH (d:ECODDomain)-[r:DISTANCE]-()";
         statmentString += buildRelationWhere();
         var queryString = statmentString + " RETURN DISTINCT r";
         var queryCountString = statmentString + " RETURN COUNT(d) AS domainCount, COUNT(DISTINCT r) AS relationshipCount";
         var query_data_object = {
           "statements": [{
             "statement": queryString,
             "resultDataContents": ["graph"]
           }]
         };
         var query_count_data_object = {
           "statements": [{
             "statement": queryCountString,
             "resultDataContents": ["row"]
           }]
         };
         return {
           queryString: JSON.stringify(query_data_object),
           queryCountString: JSON.stringify(query_count_data_object)
         };
       }
       function buildRelationWhere() {
         var statmentString = " ";
         var whereAdded = false;
         var addAnd = false;
         angular.forEach(queryObject, function (value, key) {
           var lowerAdded = false;
           if (value && (value.lower || value.upper)) {
             if (!whereAdded) {
               statmentString += " WHERE (";
               whereAdded = true;
             }
             if (addAnd) {
               statmentString += " AND"
             }
             statmentString += " (";
             if (value.lower) {
               statmentString += " " + value.lower + " <= r." + key;
               lowerAdded = true;
             }
             if (value.upper) {
               if (lowerAdded) {
                 statmentString += " AND"
               }
               statmentString += " r." + key + " <= " + value.upper;
             }
             statmentString += " )";

             addAnd = true;
           }
         });
         if (whereAdded) {
           statmentString += " )";
         }
         return statmentString;
       }
/*       function getSPDomains(sp) {
         var statmentString = "MATCH (sp:SWISSProt)-[r:MAPPED]-(p:PDBChain)-[:MAPPED]-(d:ECODDomain) WHERE sp.id = { spid } AND (d)-[:DISTANCE]-() AND  ( (({start}+{end})< 0) XOR (r.spStart <= {start} AND r.spEnd >= {end}) ) return id(d)";
         var params = {
           "spid": sp.id,
           "start": (sp.start ? sp.start : -1),
           "end": (sp.end ? sp.end : -1)
         };
         var query_data_object = {
             "statement": statmentString,
           "parameters": params,
             "resultDataContents": ["row"]
         };
         return query_data_object;
       }
       function getMultiSPDomains(sps) {
         var statements = [];
         angular.forEach(sps, function (sp) {
           statements.push(getSPDomains(sp));
         });
         return statements;
       }
       function getECODDomain(ecod) {
         var statmentString = "MATCH (d:ECODDomain) WHERE d.id = { ecodid } return id(d)";
         var params = {
           "ecodid": ecod.id
         };
         var query_data_object = {
           "statement": statmentString,
           "parameters": params,
           "resultDataContents": ["row"]
         };
         return query_data_object;
       }
       function getMultiECODDomains(ecods) {
         var statements = [];
         angular.forEach(ecods, function (ecod) {
           statements.push(getECODDomain(ecod));
         });
         return statements;
       }
       function getMultiPDBDomains(pdbs) {
         var statements = [];
         angular.forEach(pdbs, function (pdb) {
           statements.push(getPDBDomains(pdb));
         });
         return statements;
       }
       function getPDBDomains(pdb) {
         var statmentString = "MATCH MATCH (p:PDBEntry)-[:SUBCHAIN]-(:PDBChain)-[:MAPPED]-(d:ECODDomain) where p.id =~ '(?){ pdbid }' return id(d)";
         var params = {
           "spid": pdb.id,
           "start": (pdb.start ? pdb.start : -1),
           "end": (pdb.end ? pdb.end : -1)
         };
         var query_data_object = {
           "statement": statmentString,
           "parameters": params,
           "resultDataContents": ["row"]
         };
         return query_data_object;
       }*/
       function getMultiSelectionDomains(ids, type) {
         var statements = [];
         angular.forEach(ids, function (id) {
           statements.push(getSelectionDomains(id, type));
         });
         return statements;
       }
       function getSelectionDomains(id, type) {
         var statmentString = statmentTable[type];
         var params = {
           "id": ((type == "pdb" || type == "pdbc") ? normalizePdb(id.id): id.id),
           "start": (id.start ? id.start : -1),
           "end": (id.end ? id.end : -1)
         };
         var query_data_object = {
           "statement": statmentString,
           "parameters": params,
           "resultDataContents": ["row"]
         };
         return query_data_object;
       }
       function normalizePdb(pdb) {
         var res = pdb.split('.');
         try {
           res[0] = res[0].toLowerCase();
         } catch (e) {
           return undefined;
         }
         try {
           res[1] = res[1].toUpperCase();
           return res[0]+'.'+res[1];
         } catch (e) {
           return res[0];
         }
       }
    };
}]);

app.factory('vivaGraphFactory', ['$q', 'layoutSettings', 'archColors', function($q, layoutSettings, archColors) {
    var vivaGraph = function () {
    //var vivaGraph = function ( container, neo4j_graph ) {

        this.container = undefined;
        this.graph = Viva.Graph.graph();
        //this.layout = Viva.Graph.Layout.forceDirected(this.graph, layoutSettings);
        //this.layout = Viva.Graph.Layout.forceDirectedPause(this.graph, layoutSettings);
        this.layout = Viva.Graph.Layout.pausableForceDirected(this.graph);
/*      this.layout = Viva.Graph.Layout.forceAtlas2(this.graph,{
        gravity: 1,
        linLogMode: false,
        strongGravityMode: false,
        slowDown: 1,
        outboundAttractionDistribution: false,
        iterationsPerRender: 1,
        barnesHutOptimize: false,
        barnesHutTheta: 0.5,
        worker: false
      });*/
      var customNode = function (size, color) {
        function parseColor(color) {
          var parsedColor = 0x009ee8ff;

          if (typeof color === 'string' && color) {
            if (color.length === 4) { // #rgb
              color = color.replace(/([^#])/g, '$1$1'); // duplicate each letter except first #.
            }
            if (color.length === 9) { // #rrggbbaa
              parsedColor = parseInt(color.substr(1), 16);
            } else if (color.length === 7) { // or #rrggbb.
              parsedColor = (parseInt(color.substr(1), 16) << 8) | 0xff;
            } else {
              throw 'Color expected in hex format with preceding "#". E.g. #00ff00. Got value: ' + color;
            }
          } else if (typeof color === 'number') {
            parsedColor = color;
          }

          return parsedColor;
        }

        return {
          /**
           * Gets or sets size of the square side.
           */
          size: typeof size === 'number' ? size : 10,

          /**
           * Gets or sets color of the square.
           */
          get color () {
            try {
              if (this.node.data.hide) return parseColor('#D8D8D8');
              return parseColor(color);
            } catch (e) {
            //
            }
          },
          set color (color) {
            color = color;
          },
          marked: function() {
            var val = this.node.data.marked;
            if (val) {
              return val;
            }
            return 0;
          }
        };
      };
        this.graphics = Viva.Graph.View.webglGraphics();
        var nodeProgram = new Viva.Graph.View.customWebglNodeProgram();
        this.graphics.setNodeProgram(nodeProgram);
        this.graphics.node(function (node) {
            var img = customNode(10, archColors[node.data.arch]);
            img.color = img.color - 255;
            return img;
        });
        this.events = Viva.Graph.webglInputEvents(this.gr:q
      aphics, this.graph);
    };

    vivaGraph.prototype.dispose = function () {
        this.renderer.dispose();
    };

    vivaGraph.prototype.setContainer = function(container) {
      this.container =  container;
      this.createRenderer();
    };

    vivaGraph.prototype.createRenderer = function() {
        this.renderer = Viva.Graph.View.renderer(this.graph,
            {
                layout     : this.layout,
                graphics   : this.graphics,
                renderLinks : true,
                container: this.container
            }).run();
      /*this.renderer = Viva.Graph.View.pixelRenderer(this.graph,
        {
          container: this.container,
          settings: false,
          is3d: false
        });*/
    };

    return vivaGraph;
}]);

app.service('OboeWrapper', ['Oboe', function(Oboe) {
    return function(oboeParams, errCallback, notifyCallback) {
        Oboe(oboeParams).then(
            function() {
            //    finished loading
            },
            function(error){
            //    handle errors
                errCallback(error);
            },
            function(nodeObj) {
            //    handle pattern found notifictions
                notifyCallback(nodeObj);
            }
        );
    };
}]);

app.controller('domainCtrl', ['$scope', '$http','vivaGraphFactory', 'neo4jQueryBuilder', 'OboeWrapper', '$modal', 'layoutSettings', 'Papa',
    function( $scope, $http, vivaGraphFactory, neo4jQueryBuilder, OboeWrapper, $modal, layoutSettings, Papa) {

    var files = {ecodFile: undefined, pdbfile: undefined, pdbcfile: undefined, spfile: undefined};
    $scope.query = {rmsd: undefined, psim: undefined, pid: undefined, length: undefined, ligand: undefined};
    $scope.graphData = [];
    $scope.ligands = [];
    $scope.pauseRendering = true;
    $scope.pauseLayout = true;
    $scope.nodeData = undefined;
    $scope.selectionInput = undefined;

    $scope.vivaGraph = new vivaGraphFactory();

        $scope.vivaGraph.events.mouseEnter(function (node) {
            //console.log('Mouse entered node: ' + node.id);
            $scope.nodeData = node.data;
            $scope.$apply();
        }).mouseLeave(function (node) {
            //console.log('Mouse left node: ' + node.id);
            $scope.nodeData = undefined;
            $scope.$apply();
        }).dblClick(function (node) {
            //console.log('Double click on node: ' + node.id);
        }).click(function (node) {
            //console.log('Single click on node: ' + node.id);
        });

    $scope.reset = function() {
        //$scope.vivaGraph.renderer.pause();
        $scope.vivaGraph.renderer.reset();
        //$scope.vivaGraph.renderer.resume();
    };

    $scope.pauseGraphLayout = function() {
        $scope.vivaGraph.layout.pause();
        $scope.pauseLayout = false;
    };

    $scope.resumeGraphLayout = function() {
        $scope.vivaGraph.layout.resume();
        $scope.pauseLayout = true;
    };

    $scope.pauseGraphRendering = function() {
        //$scope.vivaGraph.layout.setRunLayout(false);
        $scope.vivaGraph.renderer.pause();
        $scope.pauseRendering = false;
    };

    $scope.resumeGraphRendering = function() {
        //$scope.vivaGraph.layout.setRunLayout(true);
        $scope.vivaGraph.renderer.resume();
        $scope.pauseRendering = true;
    };

    $scope.updateGraph = function(queryObject) {
        var graph = $scope.vivaGraph.graph;
        var queryStrings = neo4jQueryBuilder(queryObject).getDomains();
        var modalInstance;

        var countReq = {
            method: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            headers: {
                Accept: "application/json; charset=UTF-8",
                'Content-Type': 'application/json'
                //'X-Stream': 'true'
            },
            //data: request_data_string
            body: queryStrings.queryCountString
        };

        countReq.start = function(stream) {
            console.log("Count Start");
        };

        countReq.done = function() {
            console.log("Count Done");
            $scope.domainCount = 0;
            $scope.relationshipCount = 0;
            modalInstance = $modal.open({
                    templateUrl: 'graphLoadingModal.html',
                    controller: 'graphLoadingModalController',
                    resolve: {
                        counters: {
                            domainTotalCount: function() {
                                return $scope.domainTotalCount;
                            },
                            relationshipTotalCount: function() {
                                return $scope.relationshipTotalCount;
                            },
                            domainCount: function() {
                                return $scope.domainCount;
                            },
                            relationshipCount: function() {
                                return $scope.relationshipCount;
                            }
                        }
                    }
                }
            );
            var req = {
                method: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                headers: {
                    Accept: "application/json; charset=UTF-8",
                    'Content-Type': 'application/json'
                    //'X-Stream': 'true'
                    },
                //data: request_data_string
                body: queryStrings.queryString,
                start: function (stream) {
                    $scope.pauseGraphRendering();
                    graph.beginUpdate();
                    graph.clear();
                    console.log("Start");
                },
                done: function() {
                    console.log("Done");
                    graph.endUpdate();
                    $scope.resumeGraphRendering();
                    modalInstance.close();
                },
                patterns: {'node:graph.nodes.*': function (node) {
                  graph.addNode(node.id, node.properties);
                  $scope.domainCount++;
                  $scope.$apply();
                }, 'node:graph.relationships.*': function (node) {
                  graph.addLink(node.startNode, node.endNode);
                  $scope.relationshipCount++;
                  $scope.$apply();
                }, 'errors': function (node) {
                  console.log(node);
                }}
            };

            OboeWrapper(req,
                function (error) {
                //    handle errors
                }, function (nodeObj) {
                }
            );
        };

        countReq.patterns = {
          'node:row': function (node) {
            $scope.domainTotalCount = node[0];
            $scope.relationshipTotalCount = node[1];
            $scope.$apply();
          }
        };

        OboeWrapper(countReq,
            function(error){
                //handle errors
            },
            function(nodeObj) {
                $scope.domainTotalCount = nodeObj[0];
                $scope.relationshipTotalCount = nodeObj[1];
            }
        );
    };

    $scope.markDomains = function(selectionInput, type) {
      /*if (!selectionInput)
        return;
      var selectionObj;
      if (typeof selectionInput === 'string') {
        try {
          selectionObj = JSON.parse(selectionInput);
        } catch (e) {
          console.log(e);
          return;
        }
      } else {
        selectionObj = selectionInput;
      }*/
      var statements = [];

      /*try {
        statements = statements.concat(neo4jQueryBuilder($scope.query).getMultiSPDomains(selectionObj.sp));
        //statements.concat(neo4jQueryBuilder($scope.query).getMultiPDBDomains(selectionObj.pdb));
        //statements.concat(neo4jQueryBuilder($scope.query).getMultiPDBCDomains(selectionObj.pdbc));
        //statements = statements.concat(neo4jQueryBuilder($scope.query).getMultiECODDomains(selectionObj.ecod));
      } catch (e) {
        console.log(e);
        return;
      }*/

      statements = neo4jQueryBuilder($scope.query).getMultiSelectionDomains(selectionInput, type);
      var req = {
        method: 'POST',
        url: 'http://localhost:7474/db/data/transaction/commit',
        headers: {
          Accept: "application/json; charset=UTF-8",
          'Content-Type': 'application/json',
          'X-Stream': 'true'
        },
        //data: request_data_string
        body: JSON.stringify({"statements": statements}),
        start: function (stream) {
          console.log("Selection Start");
          $scope.vivaGraph.graph.forEachNode(function (node) {
            node.data.hide = true;
          });
        },
        done: function() {
          console.log("Selection Done");
        },
        patterns: {'node:row': function (nodeId) {
          var node = $scope.vivaGraph.graph.getNode(nodeId);
          if (node) {
            //node.data.marked = 1;
            node.data.hide = false;
          }
        }, 'errors': function (node) {
          console.log(nodeId);
        }}
      };

      OboeWrapper(req,
        function (error) {
          //    handle errors
        }, function (nodeObj) {
        }
      );

    };

    $scope.clearMarking = function () {
      $scope.vivaGraph.graph.forEachNode(function (node) {
        //node.data.marked = 0;
        node.data.hide = false;
      });
    };

    $scope.setFile = function (element, type) {
      files[type] = element.files[0];
    };

/*    $scope.setECODFile = function (element) {
      console.log('files:', element.files);
      ecodFile = element.files[0];
    };

      $scope.setPDBFile = function (element) {
        console.log('files:', element.files);
        pdbfile = element.files[0];
      };*/

    function parseFile(file, type) {
      var ids = [];
      Papa.parse(file, {
        worker: true,
        header:true,
        dynamicTyping: true,
        step: function(row) {
          //console.log("Row:", row.data);
          ids.push(row.data[0]);
        },
        complete: function() {
          console.log("All done!");
          $scope.markDomains(ids, type);
        }
      });
    }

    $scope.csvMarkDomains = function() {
      angular.forEach(files, function (value, key) { //value - file, key - type: ecod, pdbc, pdb or sp
        parseFile(value, key);
      })
    };
}]);

app.controller('graphLoadingModalController',['$scope', '$modalInstance', 'counters', function ($scope, $modalInstance, counters) {
    $scope.counters = counters;
    $scope.cancel = function() {
    //
    }
}]);

app.directive('vivagraph', [function () {
    return {
        restrict: 'E',
        scope: {
            // data objects to be passed as an attributes - for nodes and edges
            //vgData: '=data',
            //setVg: '&'
            vivaGraph: '=vivaGraph'
        },
        link: function(scope, element, attrs, fn) {
            scope.vivaGraph.setContainer(element[0]);
        }
    }
}]);

app.value('archColors',{
  'alpha arrays': '#FE8900',
  'alpha bundles': '#00FF00',
  'alpha superhelices': '#0000FF',
  'alpha duplicates or obligate multimers': '#FF0000',
  'alpha complex topology': '#01FFFE',
  'beta barrels': '#FFA6FE',
  'beta meanders': '#FFDB66',
  'beta sandwiches': '#006401',
  'beta duplicates or obligate multimers': '#010067',
  'beta complex topology': '#95003A',
  'a+b two layers': '#007DB5',
  'a+b three layers': '#FF00F6',
  'a+b four layers': '#FFEEE8',
  'a+b complex topology': '#774D00',
  'a+b duplicates or obligate multimers': '#90FB92',
  'a/b barrels': '#0076FF',
  'a/b three-layered sandwiches': '#D5FF00',
  'mixed a+b and a/b': '#FF937E',
  'few secondary structure elements': '#6A826C',
  'extended segments': '#FF029D'
});

app.value('layoutSettings', {
    springLength : 30,
    springCoeff : 0.0008,
    dragCoeff : 0.01,
    gravity : -1.2,
    theta : 1
});