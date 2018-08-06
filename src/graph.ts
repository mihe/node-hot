/** @internal */
export class Graph {
	public dependants = new Map<string, string[]>();
	public dependencies = new Map<string, string[]>();

	public addDependency(dependant: string, dependency: string): void {
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

	public removeDependant(dependency: string, dependant: string) {
		const dependencies = this.dependencies.get(dependency);
		if (dependencies) {
			const index = dependencies.indexOf(dependant);
			if (index >= 0) {
				dependencies.splice(index, 1);
			}
		}
	}

	public removeDependency(dependant: string, dependency: string) {
		const dependants = this.dependants.get(dependency);
		if (dependants) {
			const index = dependants.indexOf(dependant);
			if (index >= 0) {
				dependants.splice(index, 1);
			}
		}
	}

	public removeDependencies(dependant: string): string[] {
		let dependencies = this.dependencies.get(dependant);
		if (dependencies) {
			dependencies = dependencies.slice();
			dependencies.forEach(dependency => {
				this.removeDependant(dependency, dependant);
			});

			this.dependencies.delete(dependant);
			return dependencies;
		} else {
			return [];
		}
	}

	public getDependantsOf(dependency: string): string[] {
		return this.dependants.get(dependency) || [];
	}

	public getDependenciesOf(dependant: string): string[] {
		return this.dependencies.get(dependant) || [];
	}
}
