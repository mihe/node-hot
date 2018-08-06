"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(value) {
    return typeof value === 'function';
}
exports.isFunction = isFunction;
function isConstructorLike(value) {
    return isFunction(value);
}
exports.isConstructorLike = isConstructorLike;
function isObjectLike(value) {
    return value !== null && typeof value === 'object';
}
exports.isObjectLike = isObjectLike;
function isPlainObject(value) {
    if (!isObjectLike(value)) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    if (!proto) {
        return true;
    }
    let outerMostProto;
    for (let outerProto = value; outerProto != null; outerProto = Object.getPrototypeOf(outerProto)) {
        outerMostProto = outerProto;
    }
    return outerMostProto === proto;
}
exports.isPlainObject = isPlainObject;
function assign(target, source, filter) {
    for (const key of Object.getOwnPropertyNames(source)) {
        const desc = Object.getOwnPropertyDescriptor(source, key);
        if (!desc.writable) {
            continue;
        }
        if (desc.get || desc.set) {
            if (filter('function')) {
                Object.defineProperty(target, key, desc);
            }
        }
        else {
            const src = source[key];
            if (filter(typeof src)) {
                target[key] = src;
            }
        }
    }
}
exports.assign = assign;
