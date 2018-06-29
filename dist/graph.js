"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Graph {
    constructor() {
        this.dependants = new Map();
        this.dependencies = new Map();
    }
    addDependency(dependant, dependency) {
        const dependencies = this.dependencies.get(dependant) || [];
        if (dependencies.indexOf(dependency) < 0) {
            dependencies.push(dependency);
            this.dependencies.set(dependant, dependencies);
        }
        const dependants = this.dependants.get(dependency) || [];
        if (dependants.indexOf(dependant) < 0) {
            dependants.push(dependant);
            this.dependants.set(dependency, dependants);
        }
    }
    removeDependant(dependency, dependant) {
        const dependencies = this.dependencies.get(dependency);
        if (dependencies) {
            const index = dependencies.indexOf(dependant);
            if (index >= 0) {
                dependencies.splice(index, 1);
            }
        }
    }
    removeDependency(dependant, dependency) {
        const dependants = this.dependants.get(dependency);
        if (dependants) {
            const index = dependants.indexOf(dependant);
            if (index >= 0) {
                dependants.splice(index, 1);
            }
        }
    }
    removeDependencies(dependant) {
        let dependencies = this.dependencies.get(dependant);
        if (dependencies) {
            dependencies = dependencies.slice();
            dependencies.forEach(dependency => {
                this.removeDependant(dependency, dependant);
            });
            this.dependencies.delete(dependant);
            return dependencies;
        }
        else {
            return [];
        }
    }
    getDependantsOf(dependency) {
        return this.dependants.get(dependency) || [];
    }
    getDependenciesOf(dependant) {
        return this.dependencies.get(dependant) || [];
    }
}
exports.Graph = Graph;
