# 🔥 node-hot

node-hot is a Node.js package that will automatically monitor and hot reload
modules (stuff that you `require`).

Based off of [this article by Kenneth Chung][kentor].

### Installation

```
npm install --save-dev node-hot
```

### Usage

```js
// --- main.js ---

// Will only hot reload after this
require('node-hot');

// Main/entry module can't be reloaded, hence the extra file
require('./app');

// --- app.js ---

class Foo {}
let foo;

if (module.hot) {
    // Globally configure node-hot (optional)
    module.hot.configure({
        silent: true // Disables logging (default: false)
    });

    // Reload this module and everything that it requires (optional)
    module.hot.accept();

    // Gets called before reload (optional)
    module.hot.store(stash => {
        stash.foo = foo;
    });

    // Gets called after reload, if there was a store (optional)
    module.hot.restore(stash => {
        foo = stash.foo;
    });

    // Replaces class methods and accessors (optional)
    module.hot.patch(Foo);
}

if (!foo) {
    foo = new Foo();
}
```

Once you modify a module on disk<sup>[1]</sup>, node-hot recursively traverses the dependants of that module, looking for an accepting module. Once it finds that it will re-`require` that module.

You usually only need `accept` in one of your first modules to run. However, due to the main/entry module being treated differently from the rest by Node.js, you will not be able to `accept` from the main/entry module, meaning it can't be reloaded.

You can choose to omit `accept` entirely, in which case node-hot will automatically `accept` when it reaches a module with no dependants, which will most likely be the modules `require`'d by your main module.

[1]: Anything `require`'d from `node_modules` will not be watched.

## License

See [LICENSE](LICENSE).


[kentor]: https://kentor.me/posts/node-js-hot-reloading-development/
