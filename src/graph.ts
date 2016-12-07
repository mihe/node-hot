import { Map } from './utils';

export default class {
	dependants = new Map<string[]>();
	dependencies = new Map<string[]>();

	addDependency(dependant: string, dependency: string): void {
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

	getDependantsOf(name: string): string[] {
		return this.dependants[name] || [];
	}

	getDependenciesOf(name: string): string[] {
		return this.dependencies[name] || [];
	}
}
