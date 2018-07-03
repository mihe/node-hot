// tslint:disable-next-line:variable-name
const Module = require('module');

import * as path from 'path';
import * as chokidar from 'chokidar';
import { Graph } from './graph';
import {
	Constructor,
	isEligible,
	isPlainObject,
	isConstructorLike
} from './utils';

type StashCallback = (stash: any) => void;

interface Options {
	silent?: boolean;
	autoPatch?: boolean;
}

interface Hot {
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
		public mod: NodeModule,
		public filename: string,
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

const _opts: Required<Options> = {
	silent: false,
	autoPatch: false
};

const _graph = new Graph();
const _registry = new Map<string, RegistryEntry>();
const _watcher = chokidar.watch([], { disableGlobbing: true });

function configure(opts: Options) {
	Object.assign(_opts, opts);
}

function log(...params: any[]) {
	if (!_opts.silent) {
		console.log('[node-hot]', ...params);
	}
}

_watcher.on('change', (file: string) => {
	const entry = _registry.get(file);
	if (!entry) { return; }

	log('Changed:', path.relative(process.cwd(), entry.filename));

	for (const acceptee of reload(entry)) {
		log('Reloading:', path.relative(process.cwd(), acceptee));
		_Module.require.call(entry.mod, acceptee);
	}
});

function reload(entry: RegistryEntry, acceptees: string[] = []) {
	entry.store();

	// tslint:disable-next-line:no-dynamic-delete
	delete require.cache[entry.filename];

	const removed = _graph.removeDependencies(entry.filename);
	for (const dependency of removed) {
		_watcher.unwatch(dependency);
	}

	const dependants = _graph.getDependantsOf(entry.filename);
	if (entry.accepted || dependants.length === 0) {
		if (acceptees.indexOf(entry.filename) < 0) {
			acceptees.push(entry.filename);
		}
	} else {
		for (const dependant of dependants) {
			const dependantEntry = _registry.get(dependant);
			if (dependantEntry) {
				reload(dependantEntry, acceptees);
			}
		}
	}

	return acceptees;
}

function register(mod: NodeModule, filename: string) {
	let entry = _registry.get(filename);
	if (!entry) {
		entry = new RegistryEntry(mod, filename);
		_registry.set(filename, entry);
	}

	return entry;
}

function inject(mod: NodeModule, filename: string) {
	if (mod.hot) { return; }

	const entry = register(mod, filename);

	mod.hot = {
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

					const keys = Object.getOwnPropertyNames(currentProto);
					for (const key of keys) {
						const currentDesc = Object.getOwnPropertyDescriptor(
							currentProto,
							key
						)!;

						if (currentDesc.get || currentDesc.set) {
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

function patchExports(mod: NodeModule) {
	if (isPlainObject(mod.exports)) {
		for (const key of Object.getOwnPropertyNames(mod.exports)) {
			const xport = mod.exports[key];
			if (isConstructorLike(xport)) {
				mod.hot!.patch(xport);
			}
		}
	} else if (isConstructorLike(mod.exports)) {
		mod.hot!.patch(mod.exports);
	}
}

Module.prototype.require = function (filename: string): any {
	const caller = this as NodeModule;
	const xports = _Module.require.call(caller, filename);

	if (caller === process.mainModule) {
		return xports;
	}

	const modulePath = Module._resolveFilename(filename, caller) as string;
	if (!isEligible(modulePath)) {
		return xports;
	}

	const dependency = require.cache[modulePath] as NodeModule;
	if (!dependency) {
		return xports;
	}

	_graph.addDependency(caller.filename, dependency.filename);
	_watcher.add([caller.filename, dependency.filename]);

	return xports;
};

Module.prototype.load = function (filename: string) {
	const eligible = isEligible(filename);
	if (eligible) {
		inject(this, filename);
	}

	_Module.load.call(this, filename);

	if (eligible && _opts.autoPatch) {
		patchExports(this);
	}
};

export { configure };
