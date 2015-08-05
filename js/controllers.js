'use strict'

var angular = require('angular');

angular.module('sams.controllers', ['sams.services', 'sams.filters'])

/*
| ---------------------------------------------------------------------------
| Main Controller (contains below controllers as childrens)
| ---------------------------------------------------------------------------
*/
.controller('MainController', function($scope, SchedulerService){
  console.info('In Main Controller');
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

.controller('AboutController', function($scope){
  console.info('In AboutController');
  $scope.devteam = [

    {
      'name' : 'Babbini, Ignacio N',
      'location' : 'La Plata, Buenos Aires, Argentina',
      'mail' : 'ignababbini@gmail.com',
      'github' : 'https://github.com/inbabbini',
      'photo' : '../images/portraits/iron_portrait.png'
    },
    {
      'name' : 'Babbini, Ignacio N',
      'location' : 'La Plata, Buenos Aires, Argentina',
      'mail' : 'ignababbini@gmail.com',
      'github' : 'https://github.com/inbabbini',
      'photo' : '../images/portraits/iron_portrait.png'
    },
    {
      'name' : 'Babbini, Ignacio N',
      'location' : 'La Plata, Buenos Aires, Argentina',
      'mail' : 'ignababbini@gmail.com',
      'github' : 'https://github.com/inbabbini',
      'photo' : '../images/portraits/iron_portrait.png'
    },

    {
      'name' : 'Babbini, Ignacio N',
      'location' : 'La Plata, Buenos Aires, Argentina',
      'mail' : 'ignababbini@gmail.com',
      'github' : 'https://github.com/inbabbini',
      'photo' : '../images/portraits/iron_portrait.png'
    },
    {
      'name' : 'Babbini, Ignacio N',
      'location' : 'La Plata, Buenos Aires, Argentina',
      'mail' : 'ignababbini@gmail.com',
      'github' : 'https://github.com/inbabbini',
      'photo' : '../images/portraits/iron_portrait.png'
    }
  ];
})


/*
| ---------------------------------------------------------------------------
| Data input
| ---------------------------------------------------------------------------
*/
.controller('RequirementsController', function($scope, $state, SamsService, SchedulerService){
  console.info('In Requirements Controller');
  $scope.modes = SamsService.getModes();
  $scope.inputProcesses = ['a','b','c'];
  $scope.processes = ['a','b','c'];
  $scope.requirements = SchedulerService.getRequirements();
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

  $scope.hasPages = function(){
    return ($scope.pages && Object.keys($scope.pages).length);
  }

  $scope.next = function() {
    $scope.processRequirements();
    $state.go('step.selectAlgorithm');
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
| Algorithm Selection
| ---------------------------------------------------------------------------
*/
.controller('AlgorithmController', function($scope, SamsService, SchedulerService){
  console.info('In Algorithm Controller');

  $scope.algorithms = SamsService.getAlgorithms();

  $scope.algorithmSelected = SchedulerService.getAlgorithm();

  $scope.changeAlgorithm = function(){
    SchedulerService.setAlgorithm( $scope.algorithmSelected );
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
      console.log($scope.memorySize + ' as memory size');
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
  }

  $scope.assignmentOptions = SamsService.getAssigmentPolicies();

  if ( SchedulerService.isFixedEvenAssignmentPolicy() ) {
    $scope.selectedAssignmentOption = 'fixed';
  } else {
    $scope.selectedAssignmentOption = 'dynamic';
    // update if is not setted
    $scope.setAssignmentOption($scope.selectedAssignmentOption);
  }


  /*
  | ---------------------------------------------------------------------------
  | isLocalReplacementPolicy
  | ---------------------------------------------------------------------------
  */
  $scope.replacementOptions = SamsService.getReplacementPolicies();

  $scope.setReplacementOption = function(r){
    $scope.selectedReplacementOption = r;
    var isLocal = ($scope.selectedReplacementOption === 'local');

    SchedulerService.setLocalReplacementPolicy(isLocal);
  }

  if ( SchedulerService.isLocalReplacementPolicy() ) {
    $scope.selectedReplacementOption = 'local';
  } else {
    $scope.selectedReplacementOption = 'global';
    $scope.setReplacementOption( $scope.selectedReplacementOption );
  }

  /*
  | ---------------------------------------------------------------------------
  | isAsyncFlushReplacementPolicy and isSecondChanceReplacementPolicy
  | ---------------------------------------------------------------------------
  */
  $scope.queueOptions = SamsService.getQueuePolicies();

  $scope.changeOptions = function(){
    // TODO: check if algorithm is FIFO or LRU (for 2nd chance)
    SchedulerService.setAsyncFlushReplacementPolicy($scope.queueOptions['async-flush']);
    SchedulerService.setSecondChanceReplacementPolicy($scope.queueOptions['second-chance']);
  }
})

/*
| ---------------------------------------------------------------------------
| Show results
| ---------------------------------------------------------------------------
*/
.controller('ResolutionController', function($scope, SchedulerService){
  console.info('In Resolution Controller');

  $scope.framesTotal = SchedulerService.getMemorySize() - 1;
  $scope.results = SchedulerService.run();
  console.log($scope.results);
  $scope.instants = $scope.results.length - 1;

})
