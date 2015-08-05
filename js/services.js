'use strict'

var angular = require('angular')
  , Scheduler = require('sams');

angular.module('sams.services', [])

/*
| -----------------------------------------------------------------------------
| Validation Service
| -----------------------------------------------------------------------------
|
*/
.factory('ValidationService', function($filter){

  return {
    checkBooleanType: function(value) {
      return $filter('isBoolean')(value);
    },
    checkIntType: function(value) {
      return angular.isNumber(value);
    },
    checkObjectType: function(obj) {
      return angular.isObject(obj);
    },
    inArray: function(arr, value) {
      return $filter('inArray')(arr, value);
    }
  }
})

/*
| -----------------------------------------------------------------------------
| Sams Service (Helpers)
| -----------------------------------------------------------------------------
|
*/
.factory('SamsService', function(SchedulerService){

  return {
    areCompatiblePolicies: function(replacement, assigment){
      // Dynamic should be only global
      if ( assigment === 'dynamic'){
        if ( replacement === 'global' ) {
          return false;
        }
        return true;
      // Fixed should be only local
      } else if ( assigment === 'fixed' ) {
        if ( replacement === 'local' ) {
          return false;
        }
        return true;
      }
    },
    createRequirements: function(pages, secuences){
      var reqs = []
      angular.forEach(pages, function(pagesString, p){
        pages[p] = pagesString.split(',');
      });
      // create requirements
      secuences.forEach(function(obj, index){
        for (var i = 0; i < obj.cantPages; i++) {
          var req = {};
          req['process'] = obj.process;
          req['pageNumber'] = pages[obj.process].shift();
          req['mode'] = obj.mode;
          reqs.push(req);
        }
      });
      return reqs;
    },
    createEmptyRequirement: function() {
      return { process: null, cantPages: null, mode: modes[0]}
    },
    stringToArray: function(array, stringValue, delimiter) {
      delimiter = delimiter || ','
      if (typeof stringValue === 'string'){
        array = stringValue.split(delimiter);
        if (array[array.length-1] == ""){
          array.pop()
        }
      }
      return array;
    }
  }
})

/*
| -----------------------------------------------------------------------------
| Scheduler Service
| -----------------------------------------------------------------------------
|
*/
.factory('SchedulerService', function(ValidationService){

  var algorithms = ['fifo', 'lru', 'nru', 'optimal'];
  var modes = ['read', 'write', 'finish'];
  var assigmentPolicies = ['fixed', 'dynamic'];
  var replacementPolicies = ['local', 'global'];
  var queuePolicies = {'second-chance': false, 'async-flush':false};

  var scheduler = new Scheduler();

  return {
    /*
    | ---------------------------------------
    | set algorithm
    | ---------------------------------------
    */
    setAlgorithm: function(algorithm) {
      if ( ! ValidationService.inArray(this.getAlgorithms(), algorithm) )
        throw new Error("Algorithm doesn't exists");

      scheduler.setAlgorithm(algorithm);

      return this;
    },
    /*
    | ---------------------------------------
    | get algorithm
    | ---------------------------------------
    */
    getAlgorithm: function() {
      return scheduler.getAlgorithm();
    },
    /*
    | ---------------------------------------
    | get memory size
    | ---------------------------------------
    */
    getMemorySize: function() {
      return scheduler.getMemorySize() || 0;
    },
    /*
    | ---------------------------------------
    | is fixed Assigment
    | ---------------------------------------
    */
    isFixedEvenAssignmentPolicy: function() {
      return scheduler.isFixedEvenAssignmentPolicy();
    },
    /*
    | ---------------------------------------
    | is local Replacement
    | ---------------------------------------
    */
    isLocalReplacementPolicy: function() {
      return scheduler.isLocalReplacementPolicy();
    },
    /*
    | ---------------------------------------
    | set if is fixed or dynamic
    | ---------------------------------------
    */
    setFixedEvenAssignmentPolicy: function(enabled) {
      if ( ! ValidationService.checkBooleanType(enabled) )
        throw new Error("value should be a boolean value");

      scheduler.setFixedEvenAssignmentPolicy(enabled);

      return this;
    },
    /*
    | ---------------------------------------
    | set if is local or global
    | ---------------------------------------
    */
    setLocalReplacementPolicy: function(enabled){
      if ( ! ValidationService.checkBooleanType(enabled) )
        throw new Error("value should be a boolean value");

      scheduler.setLocalReplacementPolicy(enabled);

      return this;
    },
    /*
    | ---------------------------------------
    | set if is async flush
    | ---------------------------------------
    */
    setAsyncFlushReplacementPolicy: function(enabled){
      if ( ! ValidationService.checkBooleanType(enabled) )
        throw new Error("value should be a boolean value");

      scheduler.setAsyncFlushReplacementPolicy(enabled);

      return this;
    },
    /*
    | ---------------------------------------
    | set if is second chance
    | ---------------------------------------
    */
    setSecondChanceReplacementPolicy: function(enabled){
      if ( ! ValidationService.checkBooleanType(enabled) )
        throw new Error("value should be a boolean value");

      scheduler.setSecondChanceReplacementPolicy(enabled);

      return this;
    },
    /*
    | ---------------------------------------
    | set size of memory
    | ---------------------------------------
    */
    setMemorySize: function(size){
      if ( ! ValidationService.checkIntType(size) )
        throw new Error("value should be a integer value");

      scheduler.setMemorySize( parseInt(size) );

      return this;
    },
    /*
    | ---------------------------------------
    | set parsed requirements
    | ---------------------------------------
    */
    addRequirements: function(reqs){
      if ( !ValidationService.checkObjectType(reqs) )
        throw new Error("obj should be an object");

      scheduler.addRequirements(reqs);

      return this;
    },
    /*
    | ---------------------------------------
    | get requirements
    | ---------------------------------------
    */
    getRequirements: function(){
      return scheduler.getRequirements() || [];
    },
    /*
    | ---------------------------------------
    | verify if all data is completed
    | ---------------------------------------
    */
    isValidData: function(){
      var memSize = scheduler.getMemorySize();
      var algorithm = scheduler.getAlgorithm();
      var reqs = scheduler.getRequirements();

      return memSize && algorithm && (reqs && reqs.length);
    },
    /*
    | ---------------------------------------
    | Helpers
    | ---------------------------------------
    */
    getAlgorithms: function() {
      return algorithms;
    },
    getAssigmentPolicies: function() {
      return assigmentPolicies;
    },
    getReplacementPolicies: function() {
      return replacementPolicies;
    },
    getQueuePolicies: function() {
      return queuePolicies;
    },
    getModes: function() {
      return modes;
    },
    /*
    | ---------------------------------------
    | RUN :D
    | ---------------------------------------
    */
    run: function(){
      return scheduler.run();
    }
  }
})
