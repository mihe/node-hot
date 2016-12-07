"use strict";
var utils_1 = require("./utils");
var default_1 = (function () {
    function default_1() {
        this.dependants = new utils_1.Map();
        this.dependencies = new utils_1.Map();
    }
    default_1.prototype.addDependency = function (dependant, dependency) {
        var dependencies = this.dependencies[dependant] || [];
        if (dependencies.indexOf(dependency) < 0) {
            dependencies.push(dependency);
            this.dependencies[dependant] = dependencies;
        }
        var dependants = this.dependants[dependency] || [];
        if (dependants.indexOf(dependant) < 0) {
            dependants.push(dependant);
            this.dependants[dependency] = dependants;
        }
    };
    default_1.prototype.getDependantsOf = function (name) {
        return this.dependants[name] || [];
    };
    default_1.prototype.getDependenciesOf = function (name) {
        return this.dependencies[name] || [];
    };
    return default_1;
}());
exports.__esModule = true;
exports["default"] = default_1;
