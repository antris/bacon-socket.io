# bacon-socket.io

Wraps socket.io server side socket handling as Bacon EventStreams

## Usage

If you have socket.io client code like this:

```js
  var socket = io.connect("http://localhost:3030")
  socket.on("connect", function() {
    var counter = 0;
    setInterval(function() {
      socket.emit("hello", "World! " + ++counter)
    }, 1000)
  })
```

You can listen to `hello` events from all sockets like this:

```js
var server = require('socket.io')()
var sockets = require('bacon-socket.io')(server)

sockets.listenToAllSocketsOfType('hello').onValue(function(socketEvent) {
  console.log(socketEvent.socket.id + ' ' + socketEvent.socketData)
})
```

This will print out:

```
% node index.js
// user connects...
2Oh53qybapeIRp27AAAF World! 1
2Oh53qybapeIRp27AAAF World! 2
2Oh53qybapeIRp27AAAF World! 3
1IfF0ZFJOjTls5IvAAAG World! 1
1IfF0ZFJOjTls5IvAAAG World! 2
1IfF0ZFJOjTls5IvAAAG World! 3
1IfF0ZFJOjTls5IvAAAG World! 4
1IfF0ZFJOjTls5IvAAAG World! 5
1IfF0ZFJOjTls5IvAAAG World! 6
1IfF0ZFJOjTls5IvAAAG World! 7
1IfF0ZFJOjTls5IvAAAG World! 8
1IfF0ZFJOjTls5IvAAAG World! 9
1IfF0ZFJOjTls5IvAAAG World! 10
```

## Install

Install from npm:

    npm install bacon-socket.io

## License

Licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php).