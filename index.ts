import * as path from 'path';
import * as intersection from 'lodash.intersection';
import * as chokidar from 'chokidar';
import * as Module from 'module';
import { DepGraph } from 'dependency-graph';

declare global {
	interface NodeModule { hot: any; }
}

type Disposer = (store: any) => void;

interface IRegistryEntry {
	data: any;
	accepted: boolean;
	disposer: Disposer;
}

class Registry {
	[modulePath: string]: IRegistryEntry;
}

const modulesPath = path.sep + 'node_modules' + path.sep;

const _Module = {
	load: Module.prototype.load as Function,
	require: Module.prototype.require as Function
};

const graph = new DepGraph<string>();
const registry = new Registry;
const watcher = chokidar.watch([]);

function logInfo(...msg: any[]) {
	console.log('[node-hot]', ...msg);
}

function logError(...msg: any[]) {
	console.error('[node-hot]', ...msg);
}

watcher.on('change', (file: string) => {
	if (!graph.hasNode(file)) {
		return;
	}

	const filePath = path.relative(process.cwd(), file);
	logInfo('Changed:', filePath);

	const mods = [file].concat(
		intersection(
			graph.overallOrder(),
			graph.dependantsOf(file)));

	for (const mod of mods) {
		const modPath = path.relative(process.cwd(), mod);

		const entry = registry[mod];
		entry.data = {};
		entry.disposer(entry.data);

		delete require.cache[mod];

		if (entry.accepted) {
			try {
				logInfo('Reloading:', modPath);
				_Module.require.call(module, mod);
			} catch (err) {
				logError(err);
			}

			break;
		}
	}
});

function register(id: string) {
	let entry = registry[id];

	if (!entry) {
		entry = {
			data: {},
			accepted: false,
			disposer: () => { }
		};

		registry[id] = entry;
	}

	return entry;
}

function inject(module: NodeModule, id: string) {
	if (module.hot) {
		return;
	}

	register(id);

	const entry = registry[id];

	module.hot = {
		data: entry.data,
		accept: () => {
			entry.accepted = true;
		},
		dispose: (disposer: Disposer) => {
			entry.disposer = disposer;
		}
	};
}

function addDependency(dependant: NodeModule, dependency: NodeModule) {
	graph.addNode(dependant.filename);
	graph.addNode(dependency.filename);
	graph.addDependency(dependant.filename, dependency.filename);

	watcher.add(dependency.filename);
};

function isPackage(modulePath: string) {
	return modulePath.indexOf(modulesPath) > 0;
}

Module.prototype.require = function (name: string) {
	const dependant = this as NodeModule;
	const exports = _Module.require.call(dependant, name);

	if (dependant !== process.mainModule) {
		const modulePath = Module._resolveFilename(name, dependant) as string;
		if (!isPackage(modulePath)) {
			const dependency = require.cache[modulePath] as NodeModule;
			inject(dependant, dependant.filename);
			inject(dependency, dependency.filename);
			addDependency(dependant, dependency);
		}
	}

	return exports;
};

Module.prototype.load = function (filename: string) {
	if (!isPackage(filename)) {
		inject(this, filename);
	}

	_Module.load.call(this, filename);
};
