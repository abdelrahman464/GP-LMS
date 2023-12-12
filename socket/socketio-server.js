
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
  socket.on("user-leave-chat", (data) => {
    usersInChat = usersInChat.filter(
      (user) => user.userId !== data.user && user.chat !== data.chat
    );
  });
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    const { receiverId, chatType, message, senderId, chatId, type } = data;
    if (chatType === "user") {
      // send the message
      const user = usersInChat.find((user) => user.userId === receiverId);
      if (user) {
        if (user.chat === chatId) {
          io.to(user.socketId).emit("receive-message", { message, type });
        }
      }
      const userToUpdateChat = activeUsers.find(
        (user) => user.userId === receiverId
      );
      if (userToUpdateChat) {
        io.to(userToUpdateChat.socketId).emit("update-chat", { message, type });
      }
    } else if (chatType === "group") {
      // Find the group chat by its ID
      const groupChat = groupChats.find((chat) => chat.id === receiverId);
      if (groupChat) {
        groupChat.members.forEach((member) => {
          // send the message
          const user = usersInChat.find((user) => user.userId === member);
          if (user?.userId !== senderId && user?.chat === chatId) {
            io.to(user.socketId).emit("receive-message", {
              message,
              type,
            });
          }
          // update the chat
          const userToUpdateChat = activeUsers.find(
            (user) => user.userId === member
          );
          if (userToUpdateChat && userToUpdateChat?.userId !== senderId) {
            io.to(userToUpdateChat.socketId).emit("update-chat", {
              message,
              type,
            });
          }
        });
      }
    }
  });
  socket.on("delete-message", (data) => {
    const { receiverId, chatType, messageId, senderId, chatId } = data;
    if (chatType === "user") {
      const user = usersInChat.find((user) => user.userId === receiverId);
      if (user) {
        if (user.chat === chatId) {
          io.to(user.socketId).emit("deleted-message", { messageId });
        }
      }
    } else if (chatType === "group") {
      const groupChat = groupChats.find((chat) => chat.id === receiverId);
      if (groupChat) {
        groupChat.members.forEach((member) => {
          const user = usersInChat.find((user) => user.userId === member);
          if (user?.userId !== senderId && user?.chat === chatId) {
            console.log("sent");
            io.to(user.socketId).emit("deleted-message", {
              messageId,
            });
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


