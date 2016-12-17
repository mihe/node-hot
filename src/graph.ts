import { Map } from './utils';

class Graph {
	public dependants = new Map<string[]>();
	public dependencies = new Map<string[]>();

	public addDependency(dependant: string, dependency: string): void {
		const dependencies = this.dependencies[dependant] || [];
		if (dependencies.indexOf(dependency) < 0) {
			dependencies.push(dependency);
			this.dependencies[dependant] = dependencies;
		}

		const dependants = this.dependants[dependency] || [];
		if (dependants.indexOf(dependant) < 0) {
			dependants.push(dependant);
			this.dependants[dependency] = dependants;
		}
	}

	public removeDependant(dependency: string, dependant: string) {
		const dependencies = this.dependencies[dependency];
		if (dependencies) {
			const index = dependencies.indexOf(dependant);
			if (index >= 0) {
				dependencies.splice(index, 1);
			}
		}
	}

	public removeDependency(dependant: string, dependency: string) {
		const dependants = this.dependants[dependency];
		if (dependants) {
			const index = dependants.indexOf(dependant);
			if (index >= 0) {
				dependants.splice(index, 1);
			}
		}
	}

	public removeDependencies(dependant: string): string[] {
		let dependencies = this.dependencies[dependant];
		if (dependencies) {
			dependencies = dependencies.slice();
			dependencies.forEach(dependency => {
				this.removeDependant(dependency, dependant);
			});

			delete this.dependencies[dependant];
			return dependencies;
		} else {
			return [];
		}
	}

	public getDependantsOf(dependency: string): string[] {
		return this.dependants[dependency] || [];
	}

	public getDependenciesOf(dependant: string): string[] {
		return this.dependencies[dependant] || [];
	}
}

export {
	Graph
}
