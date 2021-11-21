'use strict';

angular.module('bitbloqOffline').factory('nodeRemote', function() {
    return require('electron').remote;
}).factory('nodeDialog', function(nodeRemote) {
    return require('electron').remote.dialog;
}).factory('nodeFs', function() {
    return require('fs');
});