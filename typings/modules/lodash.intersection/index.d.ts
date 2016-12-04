declare module 'lodash.intersection' {
	interface List<T> {
		[index: number]: T;
		length: number;
	}

	/**
	 * Creates an array of unique values that are included in all of the provided arrays using SameValueZero for
	 * equality comparisons.
	 *
	 * @param arrays The arrays to inspect.
	 * @return Returns the new array of shared values.
	 */
	function intersection<T>(...arrays: (T[] | List<T>)[]): T[];

	const tmp = intersection;
	export = tmp;
}
