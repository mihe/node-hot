import { Constructor } from './utils';
declare type StashCallback = (stash: any) => void;
interface Options {
    silent?: boolean;
    autoPatch?: boolean;
}
interface Hot {
    accept(): void;
    store(callback: StashCallback): void;
    restore(callback: StashCallback): void;
    patch(...constructors: Constructor[]): void;
}
declare global {
    interface NodeModule {
        hot?: Hot;
    }
}
declare function configure(opts: Options): void;
export { configure };
