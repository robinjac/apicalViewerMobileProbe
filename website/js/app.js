
const simulator = angular.module('simulator', ['ngRoute','ngResource']);

simulator.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home/', {
        templateUrl: 'partials/home.html',
		    controller: 'homeCtrl'
      }).
	  when('/simulator/', {
        templateUrl: 'partials/simulator.html',
        controller: 'simulatorCtrl'
      }).
	  when('/mobile/:id', {
        templateUrl: 'partials/mobile.html',
		    controller: 'mobileCtrl'
      }).
      otherwise({
        redirectTo: '/home/'
      });
  }]);