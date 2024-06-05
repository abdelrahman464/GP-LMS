/* eslint-disable prefer-template */
const io = require("socket.io")();

const usersInRoom = {}; // All user(socket id) connected to a chatroom
const socketToRoom = {}; // RoomId in which a socket id is connected

io.on("connection", (socket) => {
  console.log("Someone joined socketId: " + socket.id);

  socket.on("joinRoom", (roomId) => {
    if (usersInRoom[roomId]) {
      usersInRoom[roomId].push(socket.id);
    } else {
      usersInRoom[roomId] = [socket.id];
    }
    socketToRoom[socket.id] = roomId;
    const usersInThisRoom = usersInRoom[roomId].filter(
      (id) => id !== socket.id
    );
    socket.join(roomId); // For message
    socket.emit("usersInRoom", usersInThisRoom); // Sending all socket id already joined user in this room
  });

  // Client send this signal to server and server will send to other user of peerId (callerId is peer id)
  socket.on("sendingSignal", (payload) => {
    console.log("console.log before sending userJoined", payload.callerId);
    io.to(payload.userIdToSendSignal).emit("userJoined", {
      signal: payload.signal,
      callerId: payload.callerId,
    });
  });

  // Client site receive signal of other peer and it sending its own signal for other member
  socket.on("returningSignal", (payload) => {
    io.to(payload.callerId).emit("takingReturnedSignal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // From client send message to send all other connected user of same room
  socket.on("sendMessage", (payload) => {
    // Sending message to all other connected user at same room
    io.to(payload.roomId).emit("receiveMessage", {
      message: payload.message,
      // username: socket.username,
    });
  });

  // Someone left room
  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    let socketsIdConnectedToRoom = usersInRoom[roomId];
    if (socketsIdConnectedToRoom) {
      socketsIdConnectedToRoom = socketsIdConnectedToRoom.filter(
        (id) => id !== socket.id
      );
      usersInRoom[roomId] = socketsIdConnectedToRoom;
    }
    socket.leave(roomId); // For message group (socket)
    socket.broadcast.emit("userLeft", socket.id); // Sending socket id to all other connected user of same room without its own
  });
});

module.exports = io;
