# node-hot

node-hot is a Node.js package that will automatically monitor and hot reload
modules.

Based off of [this article by Kenneth Chung][kentor].

_(Note that node-hot is alpha software at best, and should probably not
be used in a live production environment)_

### Installation

```
npm install --save-dev node-hot
```

### Usage

Make sure you `require('node-hot')` before any other modules. Any
subsequent `require` calls will result in those files being monitored.

To actually perform the reload you will need to `accept` the reload through the
`module.hot` object somewhere in your hierarchy, like so:

```js
// main.js

if (module.hot) {
    // Notify node-hot that this module will accept a reload
    module.hot.accept();
}
```

node-hot will traverse the dependants of any changed module and look for an
accepting module, meaning you could get away with only having
`module.hot.accept` in your entry point if you wish.

If you wish to preserve state inbetween reloads, you can store that state in the
`module.hot.data` object. The callback sent into `module.hot.dispose` will be
invoked just before your module gets reloaded and will allow you to store your
state in the `data` object, like so:

```js
// main.js

var state = {
    counter: 0
}

if (module.hot) {
    // Notify node-hot that this module will accept a reload
    module.hot.accept();

    // Restore state from before the reload, if there is any
    if (module.hot.data.state) {
        state = JSON.parse(module.hot.data.state);
    }

    // Setup storing of the state for future reloads
    module.hot.dispose(function(data) {
        data.state = JSON.stringify(state);
    });
}
```


## License

See [LICENSE](LICENSE).


[kentor]: https://kentor.me/posts/node-js-hot-reloading-development/
