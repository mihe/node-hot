"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(value) {
    return typeof value === 'function';
}
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
