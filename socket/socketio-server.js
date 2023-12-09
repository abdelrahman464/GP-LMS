/* eslint-disable no-shadow */

const { Server } = require("socket.io");
const Chat = require("../models/ChatModel");
const io = new Server();

// Store active users and their sockets
let activeUsers = [];
let usersInChat = [];
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
    io.emit("get-users", activeUsers);
  });
  socket.on("new-user-in-chat", (data) => {
    if (!usersInChat.some((user) => user.userId === data.user)) {
      usersInChat.push({
        userId: data.user,
        chat: data.chat,
        socketId: socket.id,
      });
    }
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    const { receiverId, chatType, message, senderId, chatId } = data;
    if (chatType === "user") {
      const user = usersInChat.find((user) => user.userId === receiverId);
      if (user) {
        if (user.chat === chatId) {
          console.log("in user", user);
          io.to(user.socketId).emit("receive-message", message);
          
        }
      }
    } else if (chatType === "group") {
      // Find the group chat by its ID
      const groupChat = groupChats.find((chat) => chat.id === receiverId);
      if (groupChat) {
        groupChat.members.forEach((member) => {
          const user = activeUsers.find((user) => user.userId === member);
          if (user) {
            console.log("in user", user);
            if (user.userId !== senderId)
              io.to(user.socketId).emit("receive-group-message", message);
          }
        });
      }
    }
  });

  // Create a new group chat
  socket.on("create-group-chat", (chatData) => {
    const { chatId, members } = chatData;
    groupChats = groupChats.filter((chat) => chat.id !== chatId);
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
