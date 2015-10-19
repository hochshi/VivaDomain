"use strict";

var app = angular.module('app', ['ui.select', 'ngSanitize', 'ngAnimate', 'ui.bootstrap', 'ui.bootstrap.collapse', 'ngRoute']);

app.config(['$routeProvider', '$locationProvider', function ($routeProvider,     $locationProvider)
{
  $routeProvider
    .when('/', {
      templateUrl: '/jsmolViewer.html',
      controller: 'jsmolViewer'
    })
    .otherwise({
      redirectTo: '/jsmolViewer.html'
    });

  $locationProvider.html5Mode(true);
}]);

app.controller('jsmolViewer', ['$scope', '$route', '$routeParams', '$location', function ($scope, $route, $routeParams, $location) {
  $scope.domain1 = $location.search()['domain1'] || '';
  $scope.domain2 = $location.search()['domain2'] || '';
}]);