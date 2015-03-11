var Bacon = require('baconjs')
module.exports = (function(socketIo) {
  var newEventTypeToListen = new Bacon.Bus()

  var eventTypesToListen = Bacon.update([],
    [newEventTypeToListen], function(eventTypes, eventType) { return eventTypes.concat(eventType) }
  )

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

  var allEvents = Bacon.combineAsArray(newEventTypeToListen, openSockets)
    .sampledBy(newEventTypeToListen)
    .flatMap(function() {
      var eventType = arguments[0][0]
      var openSockets = arguments[0][1]
      return Bacon.mergeAll(openSockets.map(function(socket) {
        return listenToSocket(socket, eventType)
      }))
    })
    .merge(
      Bacon.combineAsArray(eventTypesToListen, incomingSockets)
        .sampledBy(incomingSockets)
        .flatMap(function() {
          var eventTypes = arguments[0][0]
          var socket = arguments[0][1]
          return Bacon.mergeAll(eventTypes.map(function(eventType) {
            return listenToSocket(socket, eventType)
          }))
        })
    )

  allEvents.map('.eventType').onValue(function(){})

  var listenToAllSocketsOfType = function(targetEventType) {
    return allEvents.filter(function(socketEvent) {
      return targetEventType == socketEvent.eventType
    })
  }
  return {
    listenToAllSocketsOfType: function(eventType) {
      newEventTypeToListen.push(eventType)
      return listenToAllSocketsOfType(eventType)
    },
    openSockets: openSockets
  }
})
