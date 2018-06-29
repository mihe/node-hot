"use strict";
exports.__esModule = true;
var Module = require('module');
var path = require("path");
var chokidar = require("chokidar");
var graph_1 = require("./graph");
var utils_1 = require("./utils");
var _Module = {
    load: Module.prototype.load,
    require: Module.prototype.require
};
var graph = new graph_1.Graph();
var registry = new utils_1.Map();
var watcher = chokidar.watch([]);
watcher.on('change', function (file) {
    var entry = registry[file];
    if (entry) {
        utils_1.logInfo('Changed:', path.relative(process.cwd(), entry.id));
        try {
            reload(entry).forEach(function (acceptee) {
                utils_1.logInfo('Reloading:', path.relative(process.cwd(), acceptee));
                _Module.require.call(module, acceptee);
            });
        }
        catch (err) {
            utils_1.logError(err);
        }
    }
});
function reload(entry, acceptees) {
    if (acceptees === void 0) { acceptees = new Array(); }
    entry.store();
    delete require.cache[entry.id];
    graph.removeDependencies(entry.id).forEach(function (d) { return watcher.unwatch(d); });
    var dependants = graph.getDependantsOf(entry.id);
    if (entry.accepted || dependants.length === 0) {
        if (acceptees.indexOf(entry.id) < 0) {
            acceptees.push(entry.id);
        }
    }
    else {
        for (var _i = 0, dependants_1 = dependants; _i < dependants_1.length; _i++) {
            var dependant = dependants_1[_i];
            var dependantEntry = registry[dependant];
            if (dependantEntry) {
                reload(dependantEntry, acceptees);
            }
        }
    }
    return acceptees;
}
function register(id) {
    var entry = registry[id];
    if (!entry) {
        entry = {
            id: id,
            accepted: false,
            stash: null,
            store: function () { }
        };
        registry[id] = entry;
    }
    return entry;
}
function inject(module, id) {
    if (module.hot) {
        return;
    }
    var entry = register(id);
    module.hot = {
        accept: function () {
            entry.accepted = true;
        },
        store: function (stasher) {
            entry.store = function () {
                entry.stash = {};
                stasher(entry.stash);
            };
        },
        restore: function (stasher) {
            if (entry.stash) {
                stasher(entry.stash);
                entry.stash = null;
            }
        }
    };
}
Module.prototype.require = function (name) {
    var caller = this;
    var exports = _Module.require.call(caller, name);
    if (caller !== process.mainModule) {
        var modulePath = Module._resolveFilename(name, caller);
        if (utils_1.isEligible(modulePath)) {
            var dependency = require.cache[modulePath];
            if (dependency) {
                graph.addDependency(caller.filename, dependency.filename);
                watcher.add([caller.filename, dependency.filename]);
            }
        }
    }
    return exports;
};
Module.prototype.load = function (filename) {
    if (utils_1.isEligible(filename)) {
        inject(this, filename);
    }
    _Module.load.call(this, filename);
};
