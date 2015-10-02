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
.controller('RequirementsController', function($rootScope, $scope, $state, $translate, SamsService, SchedulerService, ValidationService){

  $scope.init = function(){
    console.info('Init Requirements Controller');
    $scope.inputProcesses = SamsService.getInputProcesses();
    $scope.processes = SamsService.getProcesses();
    $scope.pages = SamsService.getPages();
    $scope.demands = SamsService.getDemands();
    $scope.previewRequirements = [];
    $scope.secuences = SamsService.getSequence();
    $scope.requirements = SchedulerService.getRequirements();
    if ($scope.secuences)
      $scope.showSequenceSection();
    $rootScope.$broadcast('processed');
  }

  $scope.__setAllData = function(data){
    $scope.resetAll();
    $scope.inputProcesses = data.inputProcesses;
    $scope.processes = data.processes;
    $scope.pages = data.pages;
    $scope.demands = data.demands;
    $scope.secuences = data.secuences;
    $scope.requirements = data.requirements;
    $scope.__refreshData();
    $scope.showSequenceSection();
    $scope.$apply();
  }

  $scope.import = function(){
    var el = document.getElementById('upload');
    el.click();
  }

  $scope.uploadFile = function(){
    var reader = new FileReader();
    var file = document.getElementById('upload').files[0];
    reader.readAsText(file);
    reader.onload = function(data){
      var json = JSON.parse(data.target.result);
      $scope.__setAllData(json);
    };
  }

  $scope.export = function(){
    $scope.processRequirements();
    var data = {
      'inputProcesses': $scope.inputProcesses,
      'processes': $scope.processes,
      'pages': $scope.pages,
      'demands': $scope.demands,
      'secuences': $scope.secuences,
      'requirements': $scope.requirements,
    };
    data = angular.toJson(data);
    $scope.filename = new Date().getTime()+".json";
    var downloadLink = angular.element('<a id="export"></a>');
    var blob = new Blob([data], { type:"application/json;charset=utf-8;" });
    $scope.urlExport = (window.URL || window.webkitURL).createObjectURL( blob );
    downloadLink.attr('download', $scope.filename);
		downloadLink[0].click();
  }

  $scope.next = function() {
   $rootScope.$broadcast('processing');
   $scope.processRequirements();
   $state.go('step.policies');
 }

  $scope.loadDefault = function(){
   $scope.inputProcesses = ['a','b','c'];
   $scope.processes = ['a','b','c'];
   $scope.pages = {
     a:'1r,2,3w,4,f',
     b:'5,6w,7w,F',
     c:'9r,10r,11w,f'
   };
   $scope.secuences = [
     {'process': $scope.processes[0], 'cantPages': 2},
     {'process': $scope.processes[0], 'cantPages': 3},
     {'process': $scope.processes[1], 'cantPages': 2},
     {'process': $scope.processes[1], 'cantPages': 2},
     {'process': $scope.processes[2], 'cantPages': 4},
   ];
   $scope.demands = SamsService.createDemands($scope.pages);
   $scope.__refreshData();
   $scope.showSequenceSection();
  }

  $scope.resetAll = function() {
    $scope.previewRequirements = [];
    $scope.requirements = [];
    $scope.demands = [];
    $scope.inputProcesses = [];
    $scope.processes = [];
    $scope.pages = {};
    $scope.secuences = [];
    $scope.__refreshData();
    $scope.hideSequenceSection();
  }

  /*
  * Resend data to the service
  */
  $scope.__refreshData = function(){
    SamsService.setInputProcesses($scope.inputProcesses);
    SamsService.setProcesses($scope.processes);
    SamsService.setPages($scope.pages);
    SamsService.setDemands($scope.demands);
    SamsService.setSequence($scope.secuences);
    $scope.processRequirements();
  }

  $scope.__needClean = function(){
    var isEmptyProcesses = (!$scope.processes || $scope.processes.length == 0);
    // if processes is [], then delete all info associated to processes
    if( isEmptyProcesses ){
      $scope.pages = {};
      $scope.secuences = [];
      $scope.processes = [];
    } else {
      angular.forEach($scope.pages, function(reqs,p){
        // verify if process is deleted, then delete page reqs
        if ( $scope.processes.indexOf(p) === -1 ) {
          delete $scope.pages[p];
        }
      });
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

  $scope.hideSequenceSection = function(){
    $scope.showReqSeq = false;
  }

  $scope.showSequenceSection = function(){
    $scope.showReqSeq = true;
  }

  $scope.addSequences = function() {
    $scope.hideSequenceSection();
    try{
      $scope.demands = SamsService.createDemands($scope.pages);
      $scope.showSequenceSection();
    } catch (err){
      alert(err);
    }
  }

  $scope.add = function(){
    // get len of sequence
    var totalReqs = $scope.secuences && $scope.secuences.length || 0;
    // get last req of the sequence or null
    var lastSeq = (totalReqs > 0) ? $scope.secuences[totalReqs-1] : null;
    // check if the last requirement added is valid.
    var isValidLastReq = SchedulerService.isValidRequirement(lastSeq);
    if ( totalReqs != 0 && !isValidLastReq ) {
      $translate('ERROR_LAST_REQ').then(function(translatedError){
        alert(translatedError);
      });
    } else {
      var req = {process: '', cantPages: 0};
      $scope.secuences.push(req);
    }
  }

  $scope.__currentDemanded = function(pName) {
    var currentTotalDemanded = 0;
    if (pName) {
      angular.forEach($scope.secuences, function(seq, i){
        if (seq.process === pName && seq.mode !== 'finish'){
          currentTotalDemanded += seq.cantPages;
        }
      });
    }
    return currentTotalDemanded;
  }

  $scope.remainingRequeriments = function(pName){
    var currentTotalDemanded = 0;
    var total = 0;
    if (pName) {
      total = $scope.demands[pName].length;// - 1; //exclude f
      currentTotalDemanded = $scope.__currentDemanded(pName);
    }
    return total - currentTotalDemanded;
  }

  $scope.deleteRequest = function(index){
    $scope.secuences.splice(index, 1);
  }

  $scope.checkMaxPages = function(secuence, el) {
    console.log(el.s)
    if ( $scope.pages[secuence.process] ) {
      var totalOfProcess = $scope.pages[secuence.process].split(',').length;// - 1; //exclude f
      // var remainingOfProcess = $scope.remainingRequeriments(secuence.process);
      var currentDemandedOfProcess = $scope.__currentDemanded(secuence.process);
      if ( currentDemandedOfProcess > totalOfProcess ){
        el.s.cantPages -= 1;
      }
    }
  }

  $scope.processRequirements = function(){
    var demands = angular.copy($scope.demands);
    $scope.requirements = SamsService.createRequirements($scope.secuences, demands);
    SchedulerService.addRequirements($scope.requirements);
  }

  $scope.previewAllRequirements = function() {
    // create requeriments
    $scope.processRequirements();
    $scope.previewRequirements = angular.copy($scope.requirements);
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
.controller('ResolutionController', function($window, $rootScope, $scope, $state, SchedulerService, checkData){
  console.info('In Resolution Controller');
  if (!checkData)
    return $state.go('step.requirements');

  $scope.showSolve = false;

  $scope.print = function(){
    $window.print();
  }

  $scope.__emptyResolution = function(results) {
    $scope.inputMatrix = [];
    var biggerFrame = -1;
    angular.forEach(results, function(instant, i){
      var l = instant.frames.length;
      if ( l > biggerFrame ){
        biggerFrame = l;
      }
    });
    for (var i = 0; i < results.length; i++) {
      $scope.inputMatrix[i] = [];
      for (var j = 0; j < biggerFrame; j++) {
        $scope.inputMatrix[i][j] = "";
      }
    }
    angular.forEach(results, function(memory, instant){
      memory.pageFault = false;
      memory.victim = undefined;
      angular.forEach(memory.frames, function(frame, i){
        frame.process = 'empty';
        frame.pageNumber = 0;
        frame.required = false;
        frame.pageFault = false;
        frame.referenced = false;
        frame.modified = false;
        frame.finished = false;
        frame.reservedForPageBuffering = false;
      });
      memory.potentialVictims = [];
    });
  }

  $scope.addDefaultInputMatrixUserInput = function() {

    $scope.inputMatrix[0][1] = "";
    $scope.inputMatrix[0][0] = 'a1';
    $scope.inputMatrix[0][2] = "";
    $scope.inputMatrix[0][3] = "";
    $scope.inputMatrix[1][0] = 'a1';
    $scope.inputMatrix[1][1] = 'a2';
    $scope.inputMatrix[1][2] = "";
    $scope.inputMatrix[1][3] = "";
    $scope.inputMatrix[2][0] = 'a1';
    $scope.inputMatrix[2][1] = 'a2';
    $scope.inputMatrix[2][2] = 'a3';
    $scope.inputMatrix[2][3] = "";
    $scope.inputMatrix[3][0] = 'a1';
    $scope.inputMatrix[3][1] = 'a2';
    $scope.inputMatrix[3][2] = 'a3';
    $scope.inputMatrix[3][3] = 'a4';
    $scope.inputMatrix[4][0] = "";
    $scope.inputMatrix[4][1] = "";
    $scope.inputMatrix[4][2] = "";
    $scope.inputMatrix[4][3] = "";
    $scope.inputMatrix[5][0] = 'b5';
    $scope.inputMatrix[5][1] = "";
    $scope.inputMatrix[5][2] = "";
    $scope.inputMatrix[5][3] = "";
    $scope.inputMatrix[6][0] = 'b5';
    $scope.inputMatrix[6][1] = 'b6';
    $scope.inputMatrix[6][2] = "";
    $scope.inputMatrix[6][3] = "";
    $scope.inputMatrix[7][0] = 'b5';
    $scope.inputMatrix[7][1] = 'b6';
    $scope.inputMatrix[7][2] = 'b7';
    $scope.inputMatrix[7][3] = "";
    $scope.inputMatrix[8][0] = "";
    $scope.inputMatrix[8][1] = "";
    $scope.inputMatrix[8][2] = "";
    $scope.inputMatrix[8][3] = "";
    $scope.inputMatrix[9][0] = 'c9';
    $scope.inputMatrix[9][1] = "";
    $scope.inputMatrix[9][2] = "";
    $scope.inputMatrix[9][3] = "";
    $scope.inputMatrix[10][0] = 'c9';
    $scope.inputMatrix[10][1] = 'c10';
    $scope.inputMatrix[10][2] = "";
    $scope.inputMatrix[10][3] = "";
    $scope.inputMatrix[11][0] = 'c9';
    $scope.inputMatrix[11][1] = 'c10';
    $scope.inputMatrix[11][2] = 'c11';
    $scope.inputMatrix[11][3] = "";
    $scope.inputMatrix[12][0] = "";
    $scope.inputMatrix[12][1] = "";
    $scope.inputMatrix[12][2] = "";
    $scope.inputMatrix[12][3] = "";

    console.log($scope.inputMatrix);
  }

  try {
    $scope.framesTotal = SchedulerService.getMemorySize() - 1;
    $scope.results = SchedulerService.run();
    $scope.userSolution = angular.copy($scope.results);
    $scope.__emptyResolution($scope.userSolution);
    $scope.instants = $scope.results.length - 1;

    // TODO: remove this (test)
    // $scope.addDefaultInputMatrixUserInput();

  } catch (err) {
    alert(err);
    return $state.go('step.requirements');
  } finally {
    $rootScope.$broadcast('processed');
  }

  $scope.changeFrame = function(i,j){
    console.log($scope.inputMatrix);
  }

  $scope.showOptions = function(nFrame, index){
    var modal = angular.element('#modal-options');
    $scope.currentInstant = index;
    $scope.currentFrame = nFrame;
    $scope.actual = $scope.userSolution[index].frames[nFrame];
    modal.modal('show');
  }

  $scope.checkSolution = function(){

    //should follow this steps:
    //1. validate data in inputMatrix
    //2. if valid, populate userSolution with information parsed from imputMatix
    //3. check if userSolution corresponds to results
    //4. display feedback on the resolution table


    //parse inputMatrix into userSolution
    angular.forEach($scope.inputMatrix, function(instant,instant_number){
      angular.forEach(instant, function (frames, frame_number){
        if(($scope.inputMatrix[instant_number][frame_number] != "")&&($scope.userSolution[instant_number].frames[frame_number] != undefined)){
          $scope.userSolution[instant_number].frames[frame_number].pageNumber = parseInt($scope.inputMatrix[instant_number][frame_number].match(/\d+/)[0]);
          $scope.userSolution[instant_number].frames[frame_number].process = $scope.inputMatrix[instant_number][frame_number].match(/\D+/)[0];
        }
      });
    });

    //compare userSolution to results
    var fails = 0;

    angular.forEach($scope.results, function(instant, instant_number){
      angular.forEach(instant.frames, function(frame, frame_number){

        if (frame.finished) {
          //should only check for finished in userSolution
          $scope.userSolution[instant_number].frames[frame_number].finished ? fails = fails : fails++;
        } else {
          //should check entire frame
          if(JSON.stringify(frame) == JSON.stringify($scope.userSolution[instant_number].frames[frame_number])){
            //todo piola por ahora
          } else {
            //NOPE
            fails++;
            console.log(frame.process + frame.pageNumber);
          }
        }

      });
    });

    //show feedback to user
    fails == 0 ? alert("BIEN, BOLUDO BIEEEN") : alert("RECURSÁ SORETE");

    console.log('inputMatrix');
    console.log($scope.inputMatrix);
    console.log('UserSolution');
    console.log($scope.userSolution);
    console.log('results');
    console.log($scope.results);
  }

  $scope.showVictims = function(instantIndex) {
    $scope.victimsQueue = $scope.results[instantIndex].potentialVictims;
  }

  $scope.frameClassFor = function(frame){

    if (!frame) return '';

    if(frame.finished){
        //process ended on this instant
        return 'rtable-finished';
    }

    if (frame.reservedForPageBuffering){
      //frame is async reserved
      return 'rtable-async';
    }

    if (frame.pageFault) {
      if (frame.modified){
        if(frame.referenced){
          //page is new in memory, is modified and referenced
          //note: shouldn't this be unreachable?

        } else {
          //page is new in memory and modified
          return 'rtable-newandmodified'
        }
      } else {
        //page is only new in memory
        return 'rtable-newinmemory'
      }
    } else {
      //page already in memory
      if (frame.modified){
        if (frame.referenced){
          //page modified and referenced
          return 'rtable-modifiedandreferenced'
        }else {
          //page only modified
          return 'rtable-modified'
        }
      } else {
        if (frame.referenced)
        //page only referenced
        return 'rtable-referenced'
      }
    }

    return '';
  }

})
