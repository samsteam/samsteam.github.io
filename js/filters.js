'use strict'

var angular = require('angular');

angular.module('sams.filters', [])

.filter('inArray', function(){
  return function(array, value){
      return (array.indexOf(value) !== -1);
  }
})

.filter('isBoolean', function(){
  return function(value){
      return (typeof value === 'boolean');
  }
})

.filter('capitalize', function(){
  return function(string){
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
})

.filter('makeRange', function() {
  return function(input) {
    var lowBound, highBound;
    switch (input.length) {
    case 1:
        lowBound = 0;
        highBound = parseInt(input[0]) - 1;
        break;
    case 2:
        lowBound = parseInt(input[0]);
        highBound = parseInt(input[1]);
        break;
    default:
        return input;
    }
    var result = [];
    for (var i = lowBound; i <= highBound; i++)
        result.push(i);
    return result;
  };
});
