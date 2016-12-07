# 🔥 node-hot

node-hot is a Node.js package that will automatically monitor and hot reload
modules (stuff that you `require`).

Based off of [this article by Kenneth Chung][kentor].

_(Note that node-hot is alpha software at best, and should probably not
be used in a live production environment)_

### Installation

```
npm install --save-dev node-hot
```

### Usage

##### Accept

Make sure you `require('node-hot')` before any other modules. Only modules
`require`'d after node-hot will be monitored<sup>[1]</sup>.

To actually perform the reload you can choose to `accept` the reload through
the `module.hot` object somewhere in your hierarchy, like so:

```js
if (module.hot) {
    // Notify node-hot that this module will accept a reload (optional)
    module.hot.accept();
}
```

node-hot will traverse the dependants of any changed module, looking for an
accepting module and invalidating the cache as it goes along. Once it finds an
accepting module it will then re-`require` that module, which will in turn
re-`require` all of the previously invalidated modules as well. This means you
can get away with only having `module.hot.accept` in a single
module<sup>[2]</sup>.

You can also choose omit the `accept` entirely, in which case node-hot will
automatically `accept` when it reaches a module with no dependants, which will
most likely be the modules `require`'d by your main module.

##### Stash

If you wish to preserve state inbetween reloads, you can store that state in the
`stash` object. The function sent into `module.hot.store` will be invoked just
before your module gets reloaded and will allow you to store your state in the
`stash` object, like so:

```js
var myState = {
    counter: 0
}

if (module.hot) {
    // Notify node-hot that this module will accept a reload (optional)
    module.hot.accept();

    // Setup storing of state for upcoming reloads
    module.hot.store(function(stash) {
        stash.myState = JSON.stringify(myState);
    });

    // Restore state from previous reload, if there is any
    module.hot.restore(function(stash) {
        myState = JSON.parse(stash.myState);
    });
}
```

Restoring said state is as simple as passing a function to `module.hot.restore`,
which will execute post-reload and provide you with the same `stash` object as
before the reload.


[1]: node-hot deliberately ignores anything `require`'d from `node_modules`,
meaning those modules won't be reloadable.

[2]: Due to limitations in node-hot, you will not be able to `accept` from the
main module (the entry point). This means that the main module can't be
reloaded.


## License

See [LICENSE](LICENSE).


[kentor]: https://kentor.me/posts/node-js-hot-reloading-development/
