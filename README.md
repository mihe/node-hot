# node-hot

node-hot is a simple utility that will automatically monitor and hot reload
node modules.

Based off of [an article by Kenneth Chung][kentor].

### Installation

```
npm install --save-dev node-hot
```

### Usage

Just make sure you `require('node-hot')` before any other modules. Any
subsequent `require` calls will result in those files being monitored and
reloaded upon change.


## License

See [LICENSE](LICENSE).


[kentor]: https://kentor.me/posts/node-js-hot-reloading-development/
