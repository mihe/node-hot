interface Constructor {
    new (...args: any[]): any;
}
declare function isConstructorLike(value: any): value is Constructor;
declare function isObjectLike(value: any): value is object;
declare function isPlainObject(value: any): value is Object;
export { Constructor, isConstructorLike, isObjectLike, isPlainObject };
