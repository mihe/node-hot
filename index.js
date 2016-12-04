"use strict";
var path = require("path");
var intersection = require("lodash.intersection");
var chokidar = require("chokidar");
var Module = require("module");
var dependency_graph_1 = require("dependency-graph");
var Registry = (function () {
    function Registry() {
    }
    return Registry;
}());
var modulesPath = path.sep + 'node_modules' + path.sep;
var _Module = {
    load: Module.prototype.load,
    require: Module.prototype.require
};
var graph = new dependency_graph_1.DepGraph();
var registry = new Registry;
var watcher = chokidar.watch([]);
function logInfo() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i - 0] = arguments[_i];
    }
    console.log.apply(console, ['[node-hot]'].concat(msg));
}
function logError() {
    var msg = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        msg[_i - 0] = arguments[_i];
    }
    console.error.apply(console, ['[node-hot]'].concat(msg));
}
watcher.on('change', function (file) {
    if (!graph.hasNode(file)) {
        return;
    }
    var filePath = path.relative(process.cwd(), file);
    logInfo('Changed:', filePath);
    var mods = [file].concat(intersection(graph.overallOrder(), graph.dependantsOf(file)));
    for (var _i = 0, mods_1 = mods; _i < mods_1.length; _i++) {
        var mod = mods_1[_i];
        var modPath = path.relative(process.cwd(), mod);
        var entry = registry[mod];
        entry.data = {};
        entry.disposer(entry.data);
        delete require.cache[mod];
        if (entry.accepted) {
            try {
                logInfo('Reloading:', modPath);
                _Module.require.call(module, mod);
            }
            catch (err) {
                logError(err);
            }
            break;
        }
    }
});
function register(id) {
    var entry = registry[id];
    if (!entry) {
        entry = {
            data: {},
            accepted: false,
            disposer: function () { }
        };
        registry[id] = entry;
    }
    return entry;
}
function inject(module, id) {
    if (module.hot) {
        return;
    }
    register(id);
    var entry = registry[id];
    module.hot = {
        data: entry.data,
        accept: function () {
            entry.accepted = true;
        },
        dispose: function (disposer) {
            entry.disposer = disposer;
        }
    };
}
function addDependency(dependant, dependency) {
    graph.addNode(dependant.filename);
    graph.addNode(dependency.filename);
    graph.addDependency(dependant.filename, dependency.filename);
    watcher.add(dependency.filename);
}
;
function isPackage(modulePath) {
    return modulePath.indexOf(modulesPath) > 0;
}
Module.prototype.require = function (name) {
    var dependant = this;
    var exports = _Module.require.call(dependant, name);
    if (dependant !== process.mainModule) {
        var modulePath = Module._resolveFilename(name, dependant);
        if (!isPackage(modulePath)) {
            var dependency = require.cache[modulePath];
            inject(dependant, dependant.filename);
            inject(dependency, dependency.filename);
            addDependency(dependant, dependency);
        }
    }
    return exports;
};
Module.prototype.load = function (filename) {
    if (!isPackage(filename)) {
        inject(this, filename);
    }
    _Module.load.call(this, filename);
};
