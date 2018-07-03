"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module = require('module');
const path = require("path");
const chokidar = require("chokidar");
const graph_1 = require("./graph");
const utils_1 = require("./utils");
class RegistryEntry {
    constructor(id, mod, accepted = false, stash = null, patchees = new Map(), store = () => { }) {
        this.id = id;
        this.mod = mod;
        this.accepted = accepted;
        this.stash = stash;
        this.patchees = patchees;
        this.store = store;
    }
}
const _Module = {
    load: Module.prototype.load,
    require: Module.prototype.require
};
const _opts = {
    silent: false,
    autoPatch: false
};
const _graph = new graph_1.Graph();
const _registry = new Map();
const _watcher = chokidar.watch([], { disableGlobbing: true });
function configure(opts) {
    Object.assign(_opts, opts);
}
exports.configure = configure;
function log(...params) {
    if (!_opts.silent) {
        console.log('[node-hot]', ...params);
    }
}
_watcher.on('change', (file) => {
    const entry = _registry.get(file);
    if (!entry) {
        return;
    }
    log('Changed:', path.relative(process.cwd(), entry.id));
    const acceptees = reload(entry);
    for (const acceptee of acceptees) {
        log('Reloading:', path.relative(process.cwd(), acceptee));
        _Module.require.call(entry.mod, acceptee);
    }
});
function reload(entry, acceptees = []) {
    entry.store();
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
    }
    else {
        for (const dependant of dependants) {
            const dependantEntry = _registry.get(dependant);
            if (dependantEntry) {
                reload(dependantEntry, acceptees);
            }
        }
    }
    return acceptees;
}
function register(id, mod) {
    let entry = _registry.get(id);
    if (!entry) {
        entry = new RegistryEntry(id, mod);
        _registry.set(id, entry);
    }
    return entry;
}
function inject(mod, id) {
    if (mod.hot) {
        return;
    }
    const entry = register(id, mod);
    mod.hot = {
        accept: () => {
            entry.accepted = true;
        },
        store: (stasher) => {
            entry.store = () => {
                entry.stash = {};
                stasher(entry.stash);
            };
        },
        restore: (stasher) => {
            if (entry.stash) {
                stasher(entry.stash);
                entry.stash = null;
            }
        },
        patch: (...constructors) => {
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
                        const currentDesc = Object.getOwnPropertyDescriptor(currentProto, key);
                        if (currentDesc.get || currentDesc.set) {
                            Object.defineProperty(oldProto, key, currentDesc);
                        }
                        else {
                            oldProto[key] = currentProto[key];
                        }
                    }
                    Object.setPrototypeOf(oldProto, Object.getPrototypeOf(currentProto));
                }
                history.push(current);
            }
        }
    };
}
function patchExports(mod) {
    if (utils_1.isPlainObject(mod.exports)) {
        for (const key of Object.getOwnPropertyNames(mod.exports)) {
            const xport = mod.exports[key];
            if (utils_1.isConstructorLike(xport)) {
                mod.hot.patch(xport);
            }
        }
    }
    else if (utils_1.isConstructorLike(mod.exports)) {
        mod.hot.patch(mod.exports);
    }
}
Module.prototype.require = function (name) {
    const caller = this;
    const xports = _Module.require.call(caller, name);
    if (caller !== process.mainModule) {
        const modulePath = Module._resolveFilename(name, caller);
        if (utils_1.isEligible(modulePath)) {
            const dependency = require.cache[modulePath];
            if (dependency) {
                _graph.addDependency(caller.filename, dependency.filename);
                _watcher.add([caller.filename, dependency.filename]);
            }
        }
    }
    return xports;
};
Module.prototype.load = function (filename) {
    const eligible = utils_1.isEligible(filename);
    if (eligible) {
        inject(this, filename);
    }
    _Module.load.call(this, filename);
    if (eligible && _opts.autoPatch) {
        patchExports(this);
    }
};
