declare class Map<T> {
    [key: string]: T | undefined;
}
declare function isPackage(modulePath: string): boolean;
declare function logInfo(...msg: any[]): void;
declare function logError(...msg: any[]): void;
export { Map, isPackage, logInfo, logError };
