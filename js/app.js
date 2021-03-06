'use strict'

var angular = require('angular');
var angularRouter = require('angular-ui-router');

var app = angular.module('sams', ['sams.controllers', 'sams.locales', 'ui.router', 'contenteditable']);

app.config(function($stateProvider, $urlRouterProvider, $compileProvider){

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);

  if ( navigator.userAgent === 'samsteam-app-agent' ) {
    $urlRouterProvider.otherwise('/step/requirements');
  } else {
    $urlRouterProvider.otherwise('/home');
  }

  /*
  | ---------------------------------------------------------------------------
  | Routes
  | ---------------------------------------------------------------------------
  */
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: 'templates/home.html',
      controller: 'HomeController'
    });

    $stateProvider
      .state('about', {
        url: '/about',
        templateUrl: 'templates/about.html',
        controller: 'AboutController'
      });

    $stateProvider
      .state('step', {
        url: '/step',
        abstract: true,
        template: '<ui-view/>'
      })
      .state('step.requirements', {
        url: '/requirements',
        templateUrl: 'templates/requirements.html',
        controller: 'RequirementsController'
      })
      .state('step.policies', {
        url: '/policies',
        templateUrl: 'templates/policies.html',
        controller: 'PoliciesController'
      })
      .state('step.resolution', {
        url: '/resolution',
        templateUrl: 'templates/resolution.html',
        controller: 'ResolutionController',
        resolve: {
          checkData: function( SchedulerService ){
            return SchedulerService.isValidData();
          }
        }
      })
      .state('fifo', {
        url: '/algorithms/fifo',
        templateUrl: 'templates/fifo.html',
        controller: 'FifoController'
      });
});
