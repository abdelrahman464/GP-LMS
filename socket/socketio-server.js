const io = require('socket.io')(9000
  //     , {
  //     cors: {
  //         origin: "http://localhost:3000",
  //     },
  // }
  );
  
  let users = [];
  
  // Add a user to the users list
  const addUser = (userId, socketId, roomId = null) => {
      const user = users.find(user => user.userId === userId);
      if (user) {
          user.socketId = socketId;
          user.roomId = roomId; // Update the room ID if the user rejoins or changes rooms
      } else {
          users.push({ userId, socketId, roomId });
      }
  };
  
  // Remove a user from the users list
  const removeUser = (socketId) => {
      users = users.filter(user => user.socketId !== socketId);
  };
  
  // Get a user's socket ID
  const getUserSocketId = (userId) => {
      const user = users.find(user => user.userId === userId);
      return user ? user.socketId : null;
  };
  
  // Send a private message to a specific user
  const sendPrivateMessage = (socket, { senderId, receiverId, text }) => {
      const receiverSocketId = getUserSocketId(receiverId);
      if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", { senderId, text, private: true });
      } else {
          socket.emit("errorMessage", "User not found or offline.");
      }
  };
  
  // Send a message to a group chat
  const sendGroupMessage = (socket, { senderId, roomId, text }) => {
      socket.to(roomId).emit("receiveMessage", { senderId, text, private: false });
  };
  
  io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);
  
      // User adds themselves with a userId
      socket.on("addUser", ({ userId }) => {
          addUser(userId, socket.id);
          console.log(`User ${userId} connected`);
      });
  
      // Joining a room
      socket.on("joinRoom", ({ userId, roomId }) => {
          addUser(userId, socket.id, roomId);
          socket.join(roomId);
          console.log(`User ${userId} joined room ${roomId}`);
      });
  
      // Leaving a room
      socket.on("leaveRoom", ({ userId, roomId }) => {
          socket.leave(roomId);
          console.log(`User ${userId} left room ${roomId}`);
      });
  
      // User sends a message
      socket.on("sendMessage", (messageData) => {
          if (messageData.roomId) {
              // Group message
              sendGroupMessage(socket, messageData);
          } else {
              // Private message
              sendPrivateMessage(socket, messageData);
          }
      });
  
      // User disconnects
      socket.on("disconnect", () => {
          removeUser(socket.id);
          console.log(`User disconnected: ${socket.id}`);
      });
  });
  
  console.log('Socket.IO server is running.');
  