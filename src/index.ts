import * as Module from 'module';
import * as path from 'path';
import * as chokidar from 'chokidar';
import Graph from './graph';
import { Map, logInfo, logError, isPackage } from './utils';

export type StashFn = (stash: any) => void;

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

interface IRegistryEntry {
	id: string;
	accepted: boolean;
	stash: any;
	store: () => void;
}

const _Module = {
	load: Module.prototype.load as Function,
	require: Module.prototype.require as Function
};

const graph = new Graph();
const registry = new Map<IRegistryEntry>();
const watcher = chokidar.watch([]);

watcher.on('change', (file: string) => {
	const entry = registry[file];
	if (entry) {
		logInfo('Changed:', path.relative(process.cwd(), entry.id));

		try {
			reload(entry).forEach(acceptee => {
				logInfo('Reloading:', path.relative(process.cwd(), acceptee));
				_Module.require.call(module, acceptee);
			});
		} catch (err) {
			logError(err);
		}
	}
});

function reload(entry: IRegistryEntry, acceptees = new Array<string>()) {
	entry.store();
	delete require.cache[entry.id];

	const dependants = graph.getDependantsOf(entry.id);

	if (entry.accepted || dependants.length == 0) {
		if (acceptees.indexOf(entry.id) < 0) {
			acceptees.push(entry.id);
		}
	} else {
		for (const dependant of dependants) {
			const dependantEntry = registry[dependant];
			if (dependantEntry) {
				reload(dependantEntry, acceptees);
			}
		}
	}

	return acceptees;
}

function register(id: string) {
	let entry = registry[id];

	if (!entry) {
		entry = {
			id: id,
			accepted: false,
			stash: null,
			store: () => { }
		};

		registry[id] = entry;
	}

	return entry;
}

function inject(module: NodeModule, id: string) {
	if (module.hot) {
		return;
	}

	const entry = register(id);

	module.hot = {
		accept: () => {
			entry.accepted = true;
		},
		store: (stasher: StashFn) => {
			entry.store = () => {
				entry.stash = {};
				stasher(entry.stash);
			}
		},
		restore: (stasher: StashFn) => {
			if (entry.stash) {
				stasher(entry.stash);
				entry.stash = null;
			}
		}
	};
}

function watch(caller: NodeModule, dependency: NodeModule) {
	inject(caller, caller.filename);
	inject(dependency, dependency.filename);

	graph.addDependency(caller.filename, dependency.filename);
	watcher.add([caller.filename, dependency.filename]);
}

Module.prototype.require = function (name: string) {
	const caller = this as NodeModule;
	const exports = _Module.require.call(caller, name);

	if (caller !== process.mainModule) {
		const modulePath = Module._resolveFilename(name, caller) as string;
		if (!isPackage(modulePath)) {
			const dependency = require.cache[modulePath] as NodeModule;
			if (dependency) {
				watch(caller, dependency);
			}
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
