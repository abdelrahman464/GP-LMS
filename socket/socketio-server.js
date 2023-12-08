/* eslint-disable no-shadow */

const { Server } = require("socket.io");

const io = new Server();

// Store active users and their sockets
let activeUsers = [];

// Store active group chats
// eslint-disable-next-line prefer-const
let groupChats = [];

io.on("connection", (socket) => {
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    console.log("Connected Users", activeUsers);

    // Send all active users to new user
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    const { receiverId, chatType, message } = data;

    if (chatType === "user") {
      const user = activeUsers.find((user) => user.userId === receiverId);
      if (user) {
        io.to(user.socketId).emit("receive-message", message);
      }
    } else if (chatType === "group") {
      // Find the group chat by its ID
      const groupChat = groupChats.find((chat) => chat.id === receiverId);
      if (groupChat) {
        groupChat.members.forEach((member) => {
          const user = activeUsers.find(
            (user) => user.userId === member.userId
          );
          if (user) {
            io.to(user.socketId).emit("receive-group-message", message);
          }
        });
      }
    }
  });

  // Create a new group chat
  socket.on("create-group-chat", (chatData) => {
    const { chatId, members } = chatData;
    groupChats.push({ id: chatId, members });
  });

  // Add a user to an existing group chat
  socket.on("add-user-to-group-chat", (data) => {
    const { chatId, userId } = data;
    const groupChat = groupChats.find((chat) => chat.id === chatId);
    if (groupChat) {
      groupChat.members.push({ userId });
    }
  });
});

module.exports = io;