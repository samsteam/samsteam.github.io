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
      if(!value) return false;
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
.factory('SamsService', function(){

  return {
    getLocales: function(){
      return ['es', 'en'];
    },
    getDefaultLocale: function() {
      var locale = window.localStorage.getItem('locale');
      return (!locale || locale === '') ? 'es' : locale;
    },
    setDefaultLocale: function(val) {
      window.localStorage.setItem('locale', val);
    },
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
        if (obj.mode == 'finish') {
          var req = {};
          req['process'] = obj.process;
          req['pageNumber'] = 0;
          req['mode'] = 'finish';
          reqs.push(req);
        } else {
          for (var i = 0; i < obj.cantPages; i++) {
            var req = {};
            req['process'] = obj.process;
            req['pageNumber'] = pages[obj.process].shift();
            req['mode'] = obj.mode;
            reqs.push(req);
          }
        }
      });
      return reqs;
    },
    createEmptyRequirement: function() {
      return {
        process: null,
        cantPages: 0,
        mode: null
      };
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

  var algorithms = ['fifo', 'fifo2', 'lru', 'nru', 'optimal'];
  var modes = ['read', 'write', 'finish'];
  var assigmentPolicies = ['fixed', 'dynamic'];
  var queuePolicies = {'async-flush': false};

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

      if (algorithm === 'fifo2') {
        scheduler.setAlgorithm('fifo');
        this.setSecondChanceFilter(true);
      } else {
        scheduler.setAlgorithm(algorithm);
      }

      return this;
    },
    /*
    | ---------------------------------------
    | get algorithm
    | ---------------------------------------
    */
    getAlgorithm: function() {
      var algorithm = scheduler.getAlgorithm();
      if (algorithm === 'fifo' && this.isSecondChange() ){
        return 'fifo2';
      }
      return algorithm;
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
    | is Second Chane Replacement
    | ---------------------------------------
    */
    isSecondChange: function() {
      return scheduler.isSecondChance();
    },
    /*
    | ---------------------------------------
    | is Async
    | ---------------------------------------
    */
    isPageBuffering: function() {
      return scheduler.isPageBuffering();
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
    setPageBufferingFilter: function(enabled){
      if ( ! ValidationService.checkBooleanType(enabled) )
        throw new Error("value should be a boolean value");

      scheduler.setPageBufferingFilter(enabled);

      return this;
    },
    /*
    | ---------------------------------------
    | set if is second chance
    | ---------------------------------------
    */
    setSecondChanceFilter: function(enabled){
      if ( ! ValidationService.checkBooleanType(enabled) )
        throw new Error("value should be a boolean value");

      scheduler.setSecondChanceFilter(enabled);

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
    isValidRequirement: function(req) {
      var isValid = req !== null;
      isValid = isValid && typeof req == 'object';
      isValid = isValid && req.process && req.process !== '';
      isValid = isValid && typeof req.cantPages == 'number';
      if ( isValid && req.cantPages == 0) {
        isValid = isValid && req.mode == 'finish';
      }
      isValid = isValid && ValidationService.inArray(this.getModes(), req.mode);;
      return isValid;
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
