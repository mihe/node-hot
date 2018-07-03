import * as path from 'path';

interface Constructor {
	new(...args: any[]): any;
}

const _nodeModulesPath = `${path.sep}node_modules${path.sep}`;
function isPackage(modulePath: string) {
	return modulePath.indexOf(_nodeModulesPath) > 0;
}

function isEligible(modulePath: string) {
	return !isPackage(modulePath);
}

function isFunction(value: any): value is Function {
	return typeof value === 'function';
}

function isConstructorLike(value: any): value is Constructor {
	// TODO: Find a better way (that holds up with ES5 "classes")
	return isFunction(value);
}

function isObjectLike(value: any): value is object {
	return value !== null && typeof value === 'object';
}

function isPlainObject(value: any): value is Object {
	if (!isObjectLike(value)) {
		return false;
	}

	const proto = Object.getPrototypeOf(value);
	if (!proto) {
		return true;
	}

	let outerMostProto;
	for (
		let outerProto = value;
		outerProto != null;
		outerProto = Object.getPrototypeOf(outerProto)
	) {
		outerMostProto = outerProto;
	}

	return outerMostProto === proto;
}

export {
	Constructor,
	isEligible,
	isConstructorLike,
	isObjectLike,
	isPlainObject
};
