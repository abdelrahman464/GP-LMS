const { Server } = require("socket.io"); // Ensure 'Server' is used when initializing io.
const Chat = require("../models/ChatModel"); // Make sure this model is correctly implemented.

// Initialize the Socket.IO server
const io = new Server(); // Corrected to properly initialize the socket.io server.

let activeUsers = []; // Store active users and their sockets
let usersInChat = []; // Store users currently in a chat
let groupChats = []; // Store active group chats

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("new-user-add", (newUserId) => {
    const userExists = activeUsers.some((user) => user.userId === newUserId);
    if (!userExists) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
      console.log("New user added:", newUserId);
    }
    io.emit("get-users", activeUsers); // Notify all users about the updated active users list.
  });

  socket.on("new-user-in-chat", (data) => {
    const userNotInChat = !usersInChat.some((user) => user.userId === data.user && user.chat === data.chat);
    if (userNotInChat) {
      usersInChat.push({
        userId: data.user,
        chat: data.chat,
        socketId: socket.id,
      });
    }
  });

  socket.on("user-leave-chat", (data) => {
    usersInChat = usersInChat.filter(
      (user) => !(user.userId === data.user && user.chat === data.chat)
    );
    console.log(`User ${data.user} left chat ${data.chat}`);
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    usersInChat = usersInChat.filter((user) => user.socketId !== socket.id); // Also remove the user from any chat they're in.
    io.emit("get-users", activeUsers); // Update active users list on client side.
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on("send-message", (data) => {
    const { receiverId, chatType, message, senderId, chatId } = data;
    if (chatType === "user") {
      const receiver = usersInChat.find((user) => user.userId === receiverId && user.chat === chatId);
      if (receiver) {
        io.to(receiver.socketId).emit("receive-message", { message, type: data.type });
      }
    } else if (chatType === "group") {
      const groupChat = groupChats.find((chat) => chat.id === chatId);
      if (groupChat) {
        groupChat.members.forEach((member) => {
          const memberInChat = usersInChat.find((user) => user.userId === member && user.chat === chatId);
          if (memberInChat && memberInChat.userId !== senderId) {
            io.to(memberInChat.socketId).emit("receive-group-message", { message, type: data.type });
          }
        });
      }
    }
  });

  socket.on("create-group-chat", (chatData) => {
    const { chatId, members } = chatData;
    groupChats = groupChats.filter((chat) => chat.id !== chatId); // Ensure no duplicate chats.
    groupChats.push({ id: chatId, members });
    console.log(`Group chat created: ${chatId}`);
  });

  socket.on("add-user-to-group-chat", (data) => {
    const { chatId, userId } = data;
    const groupChat = groupChats.find((chat) => chat.id === chatId);
    if (groupChat && !groupChat.members.includes(userId)) {
      groupChat.members.push(userId);
      console.log(`User ${userId} added to group chat ${chatId}`);
    }
  });
});

module.exports = { io }; // Export 'io' correctly for use elsewhere in your application.
