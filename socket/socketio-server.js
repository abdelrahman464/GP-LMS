const { Server } = require("socket.io");
const io = new Server();

// Improved data structures for efficient lookups and updates
const activeUsers = new Map(); // userID => socketID
const usersInChat = new Map(); // userID => { chatID, socketID }
const groupChats = new Map(); // chatID => { id, members }

io.on("connection", (socket) => {
  socket.on("new-user-add", (userId) => {
    activeUsers.set(userId, socket.id);
    io.emit("get-users", Array.from(activeUsers.keys()));
  });

  socket.on("new-user-in-chat", ({ user, chat }) => {
    usersInChat.set(user, { chat, socketId: socket.id });
  });

  socket.on("user-leave-chat", ({ user, chat }) => {
    if (usersInChat.has(user) && usersInChat.get(user).chat === chat) {
      usersInChat.delete(user);
    }
  });

  socket.on("disconnect", () => {
    activeUsers.delete(Array.from(activeUsers.keys()).find(key => activeUsers.get(key) === socket.id));
    usersInChat.forEach((value, key) => {
      if (value.socketId === socket.id) {
        usersInChat.delete(key);
      }
    });
    io.emit("get-users", Array.from(activeUsers.keys()));
  });

  socket.on("send-message", (data) => {
    const { receiverId, chatType, message, senderId, chatId } = data;
    if (chatType === "user") {
      const userSocketId = activeUsers.get(receiverId);
      if (userSocketId && usersInChat.get(receiverId)?.chat === chatId) {
        io.to(userSocketId).emit("receive-message", message);
      }
    } else if (chatType === "group") {
      const groupChat = groupChats.get(receiverId);
      groupChat?.members.forEach(member => {
        if (member !== senderId && usersInChat.get(member)?.chat === chatId) {
          io.to(activeUsers.get(member)).emit("receive-group-message", message);
        }
      });
    }
  });

  socket.on("create-group-chat", ({ chatId, members }) => {
    groupChats.set(chatId, { id: chatId, members });
  });

  socket.on("add-user-to-group-chat", ({ chatId, userId }) => {
    const groupChat = groupChats.get(chatId);
    if (groupChat && !groupChat.members.includes(userId)) {
      groupChat.members.push(userId);
    }
  });
});

module.exports = io;
