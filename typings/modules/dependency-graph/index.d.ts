declare module 'dependency-graph' {
	export class DepGraph<T> {
		/**
		 * Add a node in the graph with optional data. If data is not given,
		 * node will be used as data.
		 */
		addNode(node: T | string, data?: any): void;

		/**
		 * Remove a node from the graph.
		 */
		removeNode(node: T | string): void;

		/**
		 * Check if a node exists in the graph.
		 */
		hasNode(node: T | string): boolean;

		/**
		 * Get the data associated with a node (will throw an Error if the node
		 * does not exist).
		 */
		getNodeData(node: T | string): T | string;

		/**
		 * Set the data for an existing node (will throw an Error if the node
		 * does not exist).
		 */
		setNodeData(node: T | string, data: T | string): void;

		/**
		 * Add a dependency between two nodes (will throw an Error if one of the
		 * nodes does not exist).
		 */
		addDependency(from: T | string, to: T | string): void;

		/**
		 * Remove a dependency between two nodes.
		 */
		removeDependency(from: T | string, to: T | string): void;

		/**
		 * Get an array containing the nodes that the specified node depends on
		 * (transitively). If leavesOnly is true, only nodes that do not depend
		 * on any other nodes will be returned in the array.
		 */
		dependenciesOf(name: T | string, leavesOnly?: boolean): (T | string)[];

		/**
		 * Get an array containing the nodes that depend on the specified node
		 * (transitively). If leavesOnly is true, only nodes that do not have
		 * any dependants will be returned in the array.
		 */
		dependantsOf(name: T | string, leavesOnly?: boolean): (T | string)[];

		/**
		 * Construct the overall processing order for the dependency graph. If
		 * leavesOnly is true, only nodes that do not depend on any other nodes
		 * will be returned.
		 */
		overallOrder(leavesOnly?: boolean): (T | string)[];
	}
}
