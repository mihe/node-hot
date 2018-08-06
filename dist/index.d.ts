declare type Constructor = new (...args: any[]) => any;
declare type StashCallback = (stash: any) => void;
interface Options {
    silent?: boolean;
    patchExports?: boolean;
    exclude?: RegExp[];
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
