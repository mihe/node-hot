import { Map } from './utils';
declare class Graph {
    dependants: Map<string[]>;
    dependencies: Map<string[]>;
    addDependency(dependant: string, dependency: string): void;
    removeDependant(dependency: string, dependant: string): void;
    removeDependency(dependant: string, dependency: string): void;
    removeDependencies(dependant: string): string[];
    getDependantsOf(dependency: string): string[];
    getDependenciesOf(dependant: string): string[];
}
export { Graph };
