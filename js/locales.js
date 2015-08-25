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
    ABOUT_ABOUTSAMS_TITLE: 'About SAMS', //<small style="color:#488FE7">and it\'s roots</small>',
    ABOUT_TUTORIAL_TITLE: 'Tutorial', //<small style="color:#488FE7"></small>',
    ABOUT_GITHUB_TITLE: 'Project\'s Github Information', //<small style="color:#488FE7">Fork it!</small>',
    ABOUT_SAMS: 'About SAMS',
    TUTORIAL: 'Tutorial',
    GITHUB: 'GitHub',
    HOME_START: 'START',
    HOME_DOWNLOAD: 'DOWNLOAD',
    HOME_ABOUT: 'ABOUT',
    BREADCRUMB_REQUIREMENTS: 'Requirements',
    BREADCRUMB_POLICIES: 'Policies',
    BREADCRUMB_RESOLUTION: 'Resolution',
    EXAMPLE: 'Example'
  });

  $translateProvider.translations('es', {
    ABOUT_TITLE: 'Desarrolladores',
    ABOUT_ABOUTSAMS_TITLE: 'Acerca de SAMS', // <small style="color:#488FE7">y sus comienzos</small>',
    ABOUT_TUTORIAL_TITLE: 'Tutorial', //<small style="color:#488FE7"></small>',
    ABOUT_GITHUB_TITLE: 'Información del Github del proyecto', // <small style="color:#488FE7">¡Forkealo!</small>',
    ABOUT_SAMS: 'Acerca de SAMS',
    TUTORIAL: 'Tutorial',
    GITHUB: 'GitHub',
    HOME_START: 'EMPEZAR',
    HOME_DOWNLOAD: 'DESCARGAR',
    HOME_ABOUT: 'ACERCA DE',
    BREADCRUMB_REQUIREMENTS: 'Requerimientos',
    BREADCRUMB_POLICIES: 'Políticas',
    BREADCRUMB_RESOLUTION: 'Resolución',
    EXAMPLE: 'Ejemplo'
  });

  $translateProvider.preferredLanguage( 'es' );
});
