'use strict'

var angular = require('angular');

angular.module('sams.controllers', ['sams.services', 'sams.filters'])

/*
| ---------------------------------------------------------------------------
| Main Controller (contains below controllers as childrens)
| ---------------------------------------------------------------------------
*/
.controller('MainController', function($scope, $state, SamsService, $translate){

  $scope.initMain = function(){
    console.info('Init Main Controller');
    $scope.locales = SamsService.getLocales();
    $scope.locale = SamsService.getDefaultLocale();
    $translate.use($scope.locale);
  }

  $scope.is = function(routeName){
    return $state.is(routeName);
  }

  $scope.changeLocale = function(val){
    $scope.locale = val;
    $translate.use($scope.locale);
    SamsService.setDefaultLocale($scope.locale)
  }

  $scope.$on('processing', function(event, args) {
    SamsService.showLoading();
  });

  $scope.$on('processed', function(event, args) {
    SamsService.hideLoading();
  });

  $scope.isDesktopApp = (navigator.userAgent === 'samsteam-app-agent');
})

/*
| ---------------------------------------------------------------------------
| Home Controller
| ---------------------------------------------------------------------------
*/

.controller('HomeController', function($scope){
  console.info('In HomeController');
})

/*
| ---------------------------------------------------------------------------
| About Controller
| ---------------------------------------------------------------------------
*/

.controller('AboutController', function($scope, $filter){
  console.info('In AboutController');
  var devTeam = [
    {
      'name' : 'Babbini, Ignacio',
      'github' : 'https://github.com/inbabbini',
      'photo' : 'images/portraits/ignacio_babbini.png'
    },
    {
      'name' : 'Eusebi, Cirano',
      'github' : 'https://github.com/magodopado',
      'photo' : 'images/portraits/cirano_eusebi.jpg'
    },
    {
      'name' : 'Sottile, Cristian',
      'github' : 'https://github.com/cristian-s',
      'photo' : 'images/portraits/cristian_sottile.jpg'
    },

    {
      'name' : 'Aparicio, Natalia',
      'github' : 'https://github.com/natiidc',
      'photo' : 'images/portraits/natalia_aparicio.jpg'
    },
    {
      'name' : 'Cascio, Bruno',
      'github' : 'https://github.com/brunocascio',
      'photo' : 'images/portraits/bruno_cascio.jpg'
    }
  ];

  $scope.devteam = $filter('shuffle')(devTeam);
})


/*
| ---------------------------------------------------------------------------
| Data input
| ---------------------------------------------------------------------------
*/
.controller('RequirementsController', function($rootScope, $scope, $state, $translate, SamsService, SchedulerService){

  $scope.init = function(){
    console.info('Init Requirements Controller');
    $scope.previewRequirements = [];
    $scope.modes = SchedulerService.getModes();
    $scope.inputProcesses = SamsService.getInputProcesses();
    $scope.processes = SamsService.getProcesses();
    $scope.pages = SamsService.getPages();
    $scope.secuences = SamsService.getSequence();
    $scope.requirements = SchedulerService.getRequirements();
    $rootScope.$broadcast('processed');
  }

  $scope.loadDefault = function(){
    $scope.previewRequirements = [];
    $scope.inputProcesses = ['a','b','c'];
    $scope.processes = ['a','b','c'];
    $scope.pages = {
      a:'1,2,3,4',
      b:'5,6,7,8',
      c:'9,10,11'
    };
    $scope.secuences = [
      {'process': $scope.processes[0], 'cantPages': 1, 'mode': 'read'},
      {'process': $scope.processes[1], 'cantPages': 2, 'mode': 'read'},
      {'process': $scope.processes[2], 'cantPages': 1, 'mode': 'write'},
      {'process': $scope.processes[1], 'cantPages': 1, 'mode': 'read'}
    ];

    $scope.__refreshData();
  }

  /*
  * Resend data to the service
  */
  $scope.__refreshData = function(){
    $scope.previewRequirements = [];
    SamsService.setInputProcesses($scope.inputProcesses);
    SamsService.setProcesses($scope.processes);
    SamsService.setPages($scope.pages);
    SamsService.setSequence($scope.secuences);
    $scope.processRequirements();
  }

  $scope.resetAll = function() {
    $scope.previewRequirements = [];
    $scope.inputProcesses = [];
    $scope.processes = [];
    $scope.pages = {};
    $scope.secuences = [];
    $scope.__refreshData();
  }

  $scope.hasPages = function(){
    return ($scope.pages && Object.keys($scope.pages).length);
  }

  $scope.next = function() {
    $rootScope.$broadcast('processing');
    $scope.processRequirements();
    $state.go('step.policies');
  }

  $scope.__needClean = function(){
    var isEmptyPages = true;

    var isEmptyProcesses = (!$scope.processes || $scope.processes.length == 0);

    angular.forEach($scope.pages, function(p,i){
      if ( p || p !== '' ) {
        isEmptyPages = false;
      }
    });

    if( isEmptyProcesses ){
      $scope.pages = {};
      $scope.secuences = [];
      $scope.processes = [];
    }

    if ( isEmptyPages ) {
      $scope.pages = {};
      $scope.secuences = [];
    }
  }

  // parsing comma separated string
  $scope.$watch('inputProcesses', function(newVal, oldVal){
    // TODO: Validate unique processes
    // TODO: multiple commas
    $scope.processes = SamsService.stringToArray($scope.processes, newVal, ',');
    $scope.__needClean();
  });

  // parsing comma separated string
  $scope.$watch('pages', function(newVal, oldVal){
    // TODO: multiple commas
    if ( newVal !== undefined ){
      $scope.pages = newVal;
    }
    $scope.__needClean();
  }, true);

  // add a new box for future requirements
  $scope.add = function() {
    // get len of sequence
    var totalReqs = $scope.secuences.length;
    // get last req of the sequence or null
    var lastSeq = (totalReqs > 0) ? $scope.secuences[totalReqs-1] : null;
    // check if the last requirement added is valid.
    var isValidLastReq = SchedulerService.isValidRequirement(lastSeq);
    if ( totalReqs === 0 || isValidLastReq ) {
      var newReq = SamsService.createEmptyRequirement();
      $scope.secuences.push(newReq);
    } else {
      $translate('ERROR_LAST_REQ').then(function(translatedError){
        alert(translatedError);
      });
    }
  }

  /*
  * Parsing user data input and send to scheduler.
  */
  $scope.processRequirements = function(){
    //clean old requirements
    $scope.requirements = [];
    // clone pages
    var pages = angular.copy($scope.pages);
    // create requeriments
    $scope.requirements = SamsService.createRequirements(pages, $scope.secuences);
    // send to service
    SchedulerService.addRequirements($scope.requirements);
  }

  $scope.previewAllRequirements = function() {
    //clean old requirements
    $scope.previewRequirements = [];
    // clone pages
    var pages = angular.copy($scope.pages);
    // create requeriments
    $scope.previewRequirements = SamsService.createRequirements(pages, $scope.secuences);
  }

  $scope.deleteRequest = function(index){
    $scope.secuences.splice(index, 1);
  }

  $scope.remainingRequeriments = function(pName){
    if (pName){
      var total = 0;
      var actual = 0;
      var pages = $scope.pages[pName];
      if ( pages ){
        total = pages.split(',').length;
      }
      angular.forEach($scope.secuences, function(s, i){
        if (s.process === pName ) {
          actual += s.cantPages;
        }
      });
      return total - actual;
    }
  }

  $scope.isFinished = function(pName) {
    var isFinished = false;
    angular.forEach($scope.secuences, function(s, i){
      if (s.process === pName && s.mode === 'finish') {
        isFinished = true;
        return true;
      }
    });
    return isFinished;
  }

  $scope.changeMode = function(s){
    s.cantPages = 0;
  }

  $scope.checkMaxPages = function(secuence) {
    var total = $scope.pages[secuence.process].split(',').length;
    var remaining = $scope.remainingRequeriments(secuence.process);
    if ( remaining < 0 ) {
      secuence.cantPages = 0;
    }
  }
})

/*
| ---------------------------------------------------------------------------
| Policies
| ---------------------------------------------------------------------------
*/
.controller('PoliciesController', function($rootScope, $scope, $state, SamsService, SchedulerService){

  $scope.next = function(){
    $rootScope.$broadcast('processing');
    $state.go('step.resolution');
  }

  $scope.init = function(){
    console.info('Init Policies Controller');
    $scope.algorithms = SchedulerService.getAlgorithms();
    $scope.algorithmSelected = SchedulerService.getAlgorithm();
    $scope.memorySize = SchedulerService.getMemorySize() || 4;
    SchedulerService.setMemorySize($scope.memorySize) // prevent 0
    $scope.assignmentOptions = SchedulerService.getAssigmentPolicies();
    $scope.queueOptions = SchedulerService.getQueuePolicies();

    if ( SchedulerService.isFixedEvenAssignmentPolicy() ) {
      $scope.selectedAssignmentOption = 'fixed';
      SchedulerService.setLocalReplacementPolicy(true);
    } else {
      $scope.selectedAssignmentOption = 'dynamic';
      // update if is not setted
      $scope.setAssignmentOption($scope.selectedAssignmentOption);
      SchedulerService.setLocalReplacementPolicy(false);
    }
    $rootScope.$broadcast('processed');
  }

  $scope.changeAlgorithm = function(){
    SchedulerService.setAlgorithm( $scope.algorithmSelected );
  }

  /*
    * Helper, validate assign with replace policy
  */
  $scope.isAvailable = function(replaceOption) {
    var assignOption = $scope.selectedAssignmentOption;
    return SamsService.areCompatiblePolicies(replaceOption, assignOption);
  }

  $scope.changeMemorySize = function(){
    if ( typeof $scope.memorySize == 'number'){
      SchedulerService.setMemorySize( $scope.memorySize );
    }
  }

  $scope.setAssignmentOption = function(a){
    $scope.selectedReplacementOption = null;
    $scope.selectedAssignmentOption = a;
    var isFixedEven = ($scope.selectedAssignmentOption === 'fixed');
    SchedulerService.setFixedEvenAssignmentPolicy( isFixedEven );
    SchedulerService.setLocalReplacementPolicy(isFixedEven);
  }

  $scope.hasAlgorithm = function () {
    return $scope.algorithmSelected;
  }

  $scope.changeOptions = function(){
    // TODO: check if algorithm is FIFO
    SchedulerService.setPageBufferingFilter($scope.queueOptions['async-flush']);
  }
})

/*
| ---------------------------------------------------------------------------
| Show results
| ---------------------------------------------------------------------------
*/
.controller('ResolutionController', function($rootScope, $scope, $state, SchedulerService, checkData){
  console.info('In Resolution Controller');
  if (!checkData)
    return $state.go('step.requirements');

  try {
    $scope.framesTotal = SchedulerService.getMemorySize() - 1;
    $scope.results = SchedulerService.run();
    $scope.instants = $scope.results.length - 1;
  } catch (err) {
    console.log(err);
    alert(err);
    return $state.go('step.requirements');
  } finally {
    $rootScope.$broadcast('processed');
  }
})
