"use strict";
exports.__esModule = true;
var path = require("path");
var Map = (function () {
    function Map() {
    }
    return Map;
}());
exports.Map = Map;
var nodeModulesPath = path.sep + 'node_modules' + path.sep;
function isPackage(modulePath) {
    return modulePath.indexOf(nodeModulesPath) > 0;
}
exports.isPackage = isPackage;
function isEligible(modulePath) {
    return !isPackage(modulePath);
}
exports.isEligible = isEligible;
function logInfo() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    console.log.apply(console, ['[node-hot]'].concat(msg));
}
exports.logInfo = logInfo;
function logError() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i] = arguments[_i];
    }
    console.error.apply(console, ['[node-hot]'].concat(msg));
}
exports.logError = logError;
