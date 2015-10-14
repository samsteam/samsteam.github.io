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
    },
    validateDemands: function(pages) {
      angular.forEach(pages, function(req, p) {
        var matches = req.match(/^([0-9][rR|wW]{0,1}\s*,{0,1}\s*)*[fF]{0,1}$/);
        if (!matches) {
          throw new Error("Invalid Requirements in process '" + p + "'.");
        }
        if ( matches[0].toLowerCase().split(',').indexOf('f') === -1 ){
          throw new Error("The process '" + p + "' is not marked as finish (f or F)");
        }
        // var matches = matches[0].split(','); // convert to array
        // angular.forEach(matches, function(r,i){
        //   var reqMatched = r.match(/([0-9]|[0-9][rR|wW]|[fF])/);
        //   if (!reqMatched) throw new Error("Requested " + r + " is not valid");
        // });
      });
    }
  }
})

/*
| -----------------------------------------------------------------------------
| Sams Service (Helpers)
| -----------------------------------------------------------------------------
|
*/
.factory('SamsService', function(ValidationService){

  var inputProcesses = [];
  var processes = [];
  var pages = {};
  var demands = {};
  var sequence = [];

  return {
    showLoading: function(){
      document.getElementById("loading").style.display = 'block';
    },
    hideLoading: function(){
      document.getElementById("loading").style.display = 'none';
    },
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
    createDemands: function(pages){
      /* This function returns:
      * [{ page: <pageNumber>, mode: "read|write|finish" }, ...]
      */
      ValidationService.validateDemands(pages);
      var reqs = {};
      // iterate over pages of processes
      angular.forEach(pages, function(reqsString, pName){
        // initialize empty
        reqs[pName] = [];
        // convert reqs string into array
        var reqsArray = reqsString.toLowerCase().split(',');
        // create requeriments object from reqsArray
        angular.forEach(reqsArray, function(r, index){
          var req = {pageNumber: -1, mode: null};
          var lastChar = r.substr(-1);
          if ( lastChar === 'f' ) {
            req.pageNumber = -1;
            req.mode = 'finish';
          } else if (lastChar === 'r') {
            req.pageNumber = parseInt(r.substr(0, r.length-1));
            req.mode = 'read';
          } else if (lastChar === 'w') {
            req.pageNumber = parseInt(r.substr(0, r.length-1));
            req.mode = 'write';
          } else if (!isNaN(lastChar) ) { //is Number
            req.pageNumber = parseInt(lastChar);
            req.mode = 'read';
          } else {
            throw Error("Invalid Requirements: " + reqsString);
          }
          reqs[pName].push(req);
        });
      });
      return reqs;
    },
    createRequirements: function(secuence, demands){
      var reqs = [];
      angular.forEach(secuence, function(seq, i){
        for (var i = 0; i < seq.cantPages; i++) {
          var req = {};
          req['process'] = seq.process;
          var page = demands[seq.process].shift();
          req['pageNumber'] = page.pageNumber;
          req['mode'] = page.mode;
          reqs.push(req);
        }
      });
      return reqs;
    },
    // createEmptyRequirement: function() {
    //   return {
    //     process: null,
    //     cantPages: 0,
    //     mode: null
    //   };
    // },
    stringToArray: function(array, stringValue, delimiter) {
      delimiter = delimiter || ','
      if (typeof stringValue === 'string'){
        array = stringValue.split(delimiter);
        if (array[array.length-1] == ""){
          array.pop()
        }
      }
      return array;
    },
    setInputProcesses: function(arr){
      this.inputProcesses = arr;
    },
    getInputProcesses: function(){
      return this.inputProcesses;
    },
    setProcesses: function(arr){
      this.processes = arr;
    },
    getProcesses: function(){
      return this.processes;
    },
    setDemands: function(arr){
      this.demands = arr;
    },
    getDemands: function(){
      return this.demands;
    },
    setPages: function(dict){
      this.pages = dict;
    },
    getPages: function(){
      return this.pages;
    },
    setSequence: function(arr){
      this.sequence = arr;
    },
    getSequence: function(){
      return this.sequence;
    },
  }
})

/*
| -----------------------------------------------------------------------------
| Scheduler Service
| -----------------------------------------------------------------------------
|
*/
.factory('SchedulerService', function(ValidationService){

  var algorithms = ['fifo', 'fifo2', 'lru', 'optimal'];
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
