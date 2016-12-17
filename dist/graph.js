"use strict";
var utils_1 = require("./utils");
var Graph = (function () {
    function Graph() {
        this.dependants = new utils_1.Map();
        this.dependencies = new utils_1.Map();
    }
    Graph.prototype.addDependency = function (dependant, dependency) {
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
    Graph.prototype.removeDependant = function (dependency, dependant) {
        var dependencies = this.dependencies[dependency];
        if (dependencies) {
            var index = dependencies.indexOf(dependant);
            if (index >= 0) {
                dependencies.splice(index, 1);
            }
        }
    };
    Graph.prototype.removeDependency = function (dependant, dependency) {
        var dependants = this.dependants[dependency];
        if (dependants) {
            var index = dependants.indexOf(dependant);
            if (index >= 0) {
                dependants.splice(index, 1);
            }
        }
    };
    Graph.prototype.removeDependencies = function (dependant) {
        var _this = this;
        var dependencies = this.dependencies[dependant];
        if (dependencies) {
            dependencies = dependencies.slice();
            dependencies.forEach(function (dependency) {
                _this.removeDependant(dependency, dependant);
            });
            delete this.dependencies[dependant];
            return dependencies;
        }
        else {
            return [];
        }
    };
    Graph.prototype.getDependantsOf = function (dependency) {
        return this.dependants[dependency] || [];
    };
    Graph.prototype.getDependenciesOf = function (dependant) {
        return this.dependencies[dependant] || [];
    };
    return Graph;
}());
exports.Graph = Graph;
