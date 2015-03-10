var Bacon = require('baconjs')

module.exports = (function(socketIo, eventTypesToListen) {
  var incomingSockets = Bacon.fromBinder(function(sink) {
    socketIo.on('connection', function(socket) {
      sink(socket)
    })
  })

  var listenToSocket = function(socket, eventType) {
    return Bacon.fromBinder(function(sink) {
      socket.on(eventType, function(socketData) {
        sink({ eventType: eventType, socket: socket, socketData: socketData })
      })
      socket.on('disconnect', function() {
        sink(new Bacon.End())
      })
    })
  }

  var allEvents = incomingSockets.flatMap(function(socket) {
    return Bacon.mergeAll(eventTypesToListen.map(function(eventType) {
      listenToSocket(socket, eventType)
    }))
  })

  var disconnectingSockets = incomingSockets.flatMap(function(socket) {
    return Bacon.fromCallback(function(callback) {
      socket.on('disconnect', function() {
        callback(socket)
      })
    })
  })

  var openSockets = Bacon.update([],
    [incomingSockets], function(sockets, incomingSocket) { return sockets.concat(incomingSocket) },
    [disconnectingSockets], function(sockets, disconnectingSocket) {
      return sockets.filter(function(s) { return s !== disconnectingSocket })
    }
  )

  var listenToAllSocketsOfType = function(targetEventType) {
    return allEvents.filter(function(socketEvent) {
      return targetEventType == socketEvent.eventType
    })
  }
  return {
    listenToAllSocketsOfType: listenToAllSocketsOfType,
    openSockets: openSockets
  }
})
