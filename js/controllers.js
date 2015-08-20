'use strict'

var angular = require('angular');

angular.module('sams.controllers', ['sams.services', 'sams.filters'])

/*
| ---------------------------------------------------------------------------
| Main Controller (contains below controllers as childrens)
| ---------------------------------------------------------------------------
*/
.controller('MainController', function($scope, $state, SamsService){
  console.info('In Main Controller');

  $scope.locales = SamsService.getLocales();
  $scope.locale = SamsService.getDefaultLocale();

  $scope.is = function(routeName) {
    return $state.is(routeName);
  }

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
.controller('RequirementsController', function($scope, $state, SamsService, SchedulerService){
  console.info('In Requirements Controller');
  $scope.modes = SchedulerService.getModes();
  $scope.inputProcesses = [];
  $scope.processes = [];
  $scope.pages = {};
  $scope.secuences = [];
  $scope.requirements = SchedulerService.getRequirements();

  $scope.loadDefault = function(){
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
  }

  $scope.hasPages = function(){
    return ($scope.pages && Object.keys($scope.pages).length);
  }

  $scope.next = function() {
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
    var req = SamsService.createEmptyRequirement();
    $scope.secuences.push(req);
  }

  // parsing user data input and send to scheduler.
  $scope.processRequirements = function(){
    //clean old requirements
    $scope.requirements = [];
    // clone pages
    var pages = angular.copy($scope.pages);
    // create requeriments
    $scope.requirements = SamsService.createRequirements(pages, $scope.secuences);

    SchedulerService.addRequirements($scope.requirements);
  }
})

/*
| ---------------------------------------------------------------------------
| Policies
| ---------------------------------------------------------------------------
*/
.controller('PoliciesController', function($scope, SamsService, SchedulerService){
  console.info('In Policies Controller');

  /*
  | ---------------------------------------------------------------------------
  | Algorithm Selection
  | ---------------------------------------------------------------------------
  */

    $scope.algorithms = SchedulerService.getAlgorithms();

    $scope.algorithmSelected = SchedulerService.getAlgorithm();

    $scope.changeAlgorithm = function(){
      SchedulerService.setAlgorithm( $scope.algorithmSelected );
    }

  /*
  | ---------------------------------------------------------------------------
  | Helper, validate assign with replace policy
  | ---------------------------------------------------------------------------
  */
  $scope.isAvailable = function(replaceOption) {
    var assignOption = $scope.selectedAssignmentOption;
    return SamsService.areCompatiblePolicies(replaceOption, assignOption);
  }

  /*
  | ---------------------------------------------------------------------------
  | Memory
  | ---------------------------------------------------------------------------
  */
  $scope.memorySize = SchedulerService.getMemorySize() || 4; // input

  $scope.changeMemorySize = function(){
    if ( typeof $scope.memorySize == 'number'){
      SchedulerService.setMemorySize( $scope.memorySize );
    }
  }
  // run when load (UX: prevent memory 0)
  $scope.changeMemorySize();

  /*
  | ---------------------------------------------------------------------------
  | isFixedEvenAssignmentPolicy
  | ---------------------------------------------------------------------------
  */
  $scope.setAssignmentOption = function(a){
    $scope.selectedReplacementOption = null;
    $scope.selectedAssignmentOption = a;
    var isFixedEven = ($scope.selectedAssignmentOption === 'fixed');
    SchedulerService.setFixedEvenAssignmentPolicy( isFixedEven );
    SchedulerService.setLocalReplacementPolicy(isFixedEven);
  }

  $scope.assignmentOptions = SchedulerService.getAssigmentPolicies();

  if ( SchedulerService.isFixedEvenAssignmentPolicy() ) {
    $scope.selectedAssignmentOption = 'fixed';
    SchedulerService.setLocalReplacementPolicy(true);
  } else {
    $scope.selectedAssignmentOption = 'dynamic';
    // update if is not setted
    $scope.setAssignmentOption($scope.selectedAssignmentOption);
    SchedulerService.setLocalReplacementPolicy(false);
  }

  /*
  | ---------------------------------------------------------------------------
  | isAsyncFlushReplacementPolicy
  | ---------------------------------------------------------------------------
  */
  $scope.queueOptions = SchedulerService.getQueuePolicies();

  $scope.hasAlgorithm = function () {
    return $scope.algorithmSelected;
  }

  $scope.changeOptions = function(){
    // TODO: check if algorithm is FIFO
    SchedulerService.setAsyncFlushReplacementPolicy($scope.queueOptions['async-flush']);
  }
})

/*
| ---------------------------------------------------------------------------
| Show results
| ---------------------------------------------------------------------------
*/
.controller('ResolutionController', function($scope, $state, SchedulerService, checkData){
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
  }
})
