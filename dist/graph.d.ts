import { Map } from './utils';
export default class  {
    dependants: Map<string[]>;
    dependencies: Map<string[]>;
    addDependency(dependant: string, dependency: string): void;
    getDependantsOf(name: string): string[];
    getDependenciesOf(name: string): string[];
}
