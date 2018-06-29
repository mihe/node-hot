export declare type StashFn = (stash: any) => void;
export interface Hot {
    accept(): void;
    store(callback: StashFn): void;
    restore(callback: StashFn): void;
}
declare global {
    interface NodeModule {
        hot: Hot;
    }
}
