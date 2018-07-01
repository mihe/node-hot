// tslint:disable-next-line:variable-name
const Module = require('module');

import * as path from 'path';
import * as chokidar from 'chokidar';
import { Graph } from './graph';

const nodeModulesPath = `${path.sep}node_modules${path.sep}`;

function isPackage(modulePath: string) {
	return modulePath.indexOf(nodeModulesPath) > 0;
}

function isEligible(modulePath: string) {
	return !isPackage(modulePath);
}

type StashCallback = (stash: any) => void;

interface Constructor {
	new(...args: any[]): any;
}

interface Options {
	silent: boolean;
}

interface Hot {
	configure(opts: Options): void;
	accept(): void;
	store(callback: StashCallback): void;
	restore(callback: StashCallback): void;
	patch(...constructors: Constructor[]): void;
}

declare global {
	interface NodeModule {
		hot?: Hot;
	}
}

class RegistryEntry {
	constructor(
		public id: string,
		public mod: NodeModule,
		public accepted = false,
		public stash: Object | null = null,
		public patchees = new Map<string, Constructor[]>(),
		public store = () => { }
	) { }
}

const _Module = {
	load: Module.prototype.load as Function,
	require: Module.prototype.require as Function
};

const _opts: Options = {
	silent: false
};

const _graph = new Graph();
const _registry = new Map<string, RegistryEntry>();
const _watcher = chokidar.watch([], { disableGlobbing: true });

_watcher.on('change', (file: string) => {
	const entry = _registry.get(file);
	if (entry == null) { return; }

	if (!_opts.silent) {
		console.log('Changed:', path.relative(process.cwd(), entry.id));
	}

	const acceptees = reload(entry);
	for (const acceptee of acceptees) {
		if (!_opts.silent) {
			console.log('Reloading:', path.relative(process.cwd(), acceptee));
		}

		_Module.require.call(entry.mod, acceptee);
	}
});

function reload(entry: RegistryEntry, acceptees: string[] = []) {
	entry.store();

	// tslint:disable-next-line:no-dynamic-delete
	delete require.cache[entry.id];

	const removed = _graph.removeDependencies(entry.id);
	for (const dependency of removed) {
		_watcher.unwatch(dependency);
	}

	const dependants = _graph.getDependantsOf(entry.id);
	if (entry.accepted || dependants.length === 0) {
		if (acceptees.indexOf(entry.id) < 0) {
			acceptees.push(entry.id);
		}
	} else {
		for (const dependant of dependants) {
			const dependantEntry = _registry.get(dependant);
			if (dependantEntry != null) {
				reload(dependantEntry, acceptees);
			}
		}
	}

	return acceptees;
}

function register(id: string, mod: NodeModule) {
	let entry = _registry.get(id);
	if (entry == null) {
		entry = new RegistryEntry(id, mod);
		_registry.set(id, entry);
	}

	return entry;
}

function inject(mod: NodeModule, id: string) {
	if (mod.hot != null) { return; }

	const entry = register(id, mod);

	mod.hot = {
		configure: (opts: Options) => {
			Object.assign(_opts, opts);
		},
		accept: () => {
			entry.accepted = true;
		},
		store: (stasher: StashCallback) => {
			entry.store = () => {
				entry.stash = {};
				stasher(entry.stash);
			};
		},
		restore: (stasher: StashCallback) => {
			if (entry.stash) {
				stasher(entry.stash);
				entry.stash = null;
			}
		},
		patch: (...constructors: Constructor[]) => {
			const { patchees } = entry;

			for (const current of constructors) {
				const currentProto = current.prototype;

				let history = patchees.get(current.name);
				if (history == null) {
					history = [];
					patchees.set(current.name, history);
				}

				for (const old of history) {
					const oldProto = old.prototype;

					for (const key of Object.getOwnPropertyNames(currentProto)) {
						const currentDesc = Object.getOwnPropertyDescriptor(currentProto, key)!;
						const hasGetOrSet = currentDesc.get != null || currentDesc.set != null;

						if (hasGetOrSet) {
							Object.defineProperty(oldProto, key, currentDesc);
						} else {
							oldProto[key] = currentProto[key];
						}
					}

					Object.setPrototypeOf(
						oldProto,
						Object.getPrototypeOf(currentProto)
					);
				}

				history.push(current);
			}
		}
	};
}

Module.prototype.require = function (name: string) {
	const caller = this as NodeModule;
	const exports = _Module.require.call(caller, name);

	if (caller !== process.mainModule) {
		const modulePath = Module._resolveFilename(name, caller) as string;
		if (isEligible(modulePath)) {
			const dependency = require.cache[modulePath] as NodeModule;
			if (dependency) {
				_graph.addDependency(caller.filename, dependency.filename);
				_watcher.add([caller.filename, dependency.filename]);
			}
		}
	}

	return exports;
};

Module.prototype.load = function (filename: string) {
	if (isEligible(filename)) {
		inject(this, filename);
	}

	_Module.load.call(this, filename);
};
