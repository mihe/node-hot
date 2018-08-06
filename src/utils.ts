type Constructor = new (...args: any[]) => any;

/** @internal */
export function isFunction(value: any): value is Function {
	return typeof value === 'function';
}

/** @internal */
export function isConstructorLike(value: any): value is Constructor {
	// TODO: Find a better way (that holds up with ES5 "classes")
	return isFunction(value);
}

/** @internal */
export function isObjectLike(value: any): value is object {
	return value !== null && typeof value === 'object';
}

/** @internal */
export function isPlainObject(value: any): value is Object {
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

/** @internal */
export function assign(
	target: Object,
	source: Object,
	filter: (key: string) => boolean
) {
	for (const key of Object.getOwnPropertyNames(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key)!;
		if (!desc.writable) { continue; }

		if (desc.get || desc.set) {
			if (filter('function')) {
				Object.defineProperty(target, key, desc);
			}
		} else {
			const src = source[key];
			if (filter(typeof src)) {
				target[key] = src;
			}
		}
	}
}
