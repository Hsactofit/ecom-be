const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routes/index");
const config = require("./config/appConfig");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const http = require("http");
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      config.server.frontendUrl || "*",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "https://shop.technologyheaven.in",
      "https://seller.technologyheaven.in",
      "https://register.technologyheaven.in",
      "https://admin.technologyheaven.in"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [
      config.server.frontendUrl || "*",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
      "https://shop.technologyheaven.in",
      "https://seller.technologyheaven.in",
      "https://register.technologyheaven.in",
      "https://admin.technologyheaven.in"
    ],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));

// Mount all routes
app.use(routes);

// Database Connection
mongoose
  .connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to the database"))
  .catch((err) => {
    console.error("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

  const onlineUsers = new Map();

// Socket.IO Integration
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);
    // Broadcast to all users that this user is online
    io.emit("userStatusChange", { userId, status: "online" });

    // Send the complete list of online users to the newly connected user
    io.to(socket.id).emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // Handle user typing status
  socket.on("typing", ({ chatId, userId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { chatId, userId, isTyping: true });
    }
  });
  
  // Handle user stopped typing
  socket.on("stopTyping", ({ chatId, userId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { chatId, userId, isTyping: false });
    }
  });

  // Handle seller request notification
  socket.on("becomeSellerRequest", (data) => {
    console.log("New seller request received:", data);
    io.emit("newNotification", {
      type: "SELLER_REQUEST",
      title: "New Seller Request",
      message: `${data.customerName} has requested to become seller`,
      requestId: data.requestId,
      timestamp: new Date(),
    });
  });

  // Handle product approval request notification
  socket.on("productApprovalRequest", (data) => {
    console.log("New product approval request received:", data);
    io.emit("newNotification", {
      type: "PRODUCT_REQUEST",
      title: "New Product Request",
      message: `${data.businessName} has made a product request`,
      requestId: data.requestId,
      productId: data.productId,
      timestamp: new Date(),
    });
  });

  socket.on("registerUser", (userId) => {
    socket.join(userId); // Join room for this user
    
    onlineUsers.set(userId, socket.id);
    
    // Broadcast to all users that this user is online
    io.emit("userStatusChange", { userId, status: "online" });
    // Send the complete list of online users to the newly registered user
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("sendMessage", async ({ chatId, senderId, receiverId, message }) => {
    try {
      // Emit to receiver with unread status
      io.to(receiverId).emit("receiveMessage", { 
        chatId,
        senderId, 
        message,
        timestamp: new Date(),
        read: false
      });

      // Update unread count in the database
      await Chat.findByIdAndUpdate(chatId, {
        $inc: { [`unreadCount.${receiverId}`]: 1 }
      });

      io.to(receiverId).emit("unreadCountUpdate", { chatId, senderId, count });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  
  socket.on("fetchUnreadChats", async ( userId) => {
    try {
      // Find all chats where the user has unread messages
      console.log("user",userId);
      const unreadChats = await Chat.find({
        [`unreadCount.${userId}`]: { $gt: 0 }
      });
  
      console.log("ubread",unreadChats);
      // For each unread chat, get the last message and emit it
      for (const chat of unreadChats) {
        // Get the last message for this chat
        const lastMessage = await Chat.findOne({ 
          chatId: chat._id 
        }).sort({ timestamp: -1 });
  
        if (lastMessage) {
          // Emit the unread message to the user
          io.to(userId).emit("receiveMessage", {
            chatId: chat._id,
            senderId: lastMessage.senderId,
            message: lastMessage.message,
            timestamp: lastMessage.timestamp,
            read: false
          });
  
          // Also emit the unread count
          io.to(userId).emit("unreadCountUpdate", {
            chatId: chat._id,
            senderId: lastMessage.senderId,
            count: chat.unreadCount.get(userId) || 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching unread chats:", error);
    }
  });

  // Add new event for marking messages as read
  socket.on("markMessagesRead", async ({ chatId, userId }) => {
    try {
      await Chat.findByIdAndUpdate(chatId, {
        $set: {
          "messages.$[].read": true,
          "lastMessage.read": true,
          [`unreadCount.${userId}`]: 0
        }
      });

      // Emit to all participants that messages have been read
      const chat = await Chat.findById(chatId);
      chat.participants.forEach(participantId => {
        io.to(participantId.toString()).emit("messagesMarkedRead", {
          chatId,
          userId
        });
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  });
  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit("userStatusChange", { userId: socket.userId, status: "offline" });
      // Broadcast updated online users list after disconnect
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }
    console.log("User disconnected:", socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message:
      config.server.env === "development"
        ? err.message
        : "Something went wrong!",
  });
});

// Start the server
const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
