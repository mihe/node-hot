"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module = require('module');
const path = require("path");
const chokidar = require("chokidar");
const graph_1 = require("./graph");
const utils_1 = require("./utils");
class RegistryEntry {
    constructor(mod, filename, accepted = false, stash = null, patchees = new Map(), store = () => { }) {
        this.mod = mod;
        this.filename = filename;
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
    log('Changed:', path.relative(process.cwd(), entry.filename));
    for (const acceptee of reload(entry)) {
        log('Reloading:', path.relative(process.cwd(), acceptee));
        _Module.require.call(entry.mod, acceptee);
    }
});
function reload(entry, acceptees = []) {
    entry.store();
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
function register(mod, filename) {
    let entry = _registry.get(filename);
    if (!entry) {
        entry = new RegistryEntry(mod, filename);
        _registry.set(filename, entry);
    }
    return entry;
}
function inject(mod, filename) {
    if (mod.hot) {
        return;
    }
    const entry = register(mod, filename);
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
Module.prototype.require = function (filename) {
    const caller = this;
    const xports = _Module.require.call(caller, filename);
    if (caller === process.mainModule) {
        return xports;
    }
    const modulePath = Module._resolveFilename(filename, caller);
    if (!utils_1.isEligible(modulePath)) {
        return xports;
    }
    const dependency = require.cache[modulePath];
    if (!dependency) {
        return xports;
    }
    _graph.addDependency(caller.filename, dependency.filename);
    _watcher.add([caller.filename, dependency.filename]);
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
