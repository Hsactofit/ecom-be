const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routes/index");
const config = require("./config/appConfig");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      config.server.frontendUrl || "*",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: [
      config.server.frontendUrl || "*",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());
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

// Socket.IO Integration
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Example: Handle incoming events
  socket.on("becomeSellerRequest", (data) => {
    console.log("New seller request received:", data);

    // Emit notification to all connected admin clients
    io.emit("newNotification", {
      title: "New Seller Request",
      message: `User ${data.customerName} wants to become a seller.`,
      requestId: data.requestId,
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
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
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
