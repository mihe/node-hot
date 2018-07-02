declare type StashCallback = (stash: any) => void;
interface Constructor {
    new (...args: any[]): any;
}
interface Options {
    silent?: boolean;
}
interface Hot {
    configure(opts: Options): void;
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
export {};
