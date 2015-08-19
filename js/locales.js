'use strict'

var angular = require('angular');
var translator = require('angular-translate');

var app = angular.module('sams.locales', ['pascalprecht.translate']);

app.config(function($translateProvider){
  /*
  | ---------------------------------------------------------------------------
  | Translates
  | ---------------------------------------------------------------------------
  */

  $translateProvider.useSanitizeValueStrategy('escaped');

  $translateProvider.translations('en', {
    ABOUT_TITLE: 'Devteam',
  });

  $translateProvider.translations('es', {
    ABOUT_TITLE: 'Devteam',
  });

  $translateProvider.preferredLanguage( 'es' );
});
