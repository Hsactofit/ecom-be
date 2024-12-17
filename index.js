const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routes/index");
const config = require("./config/appConfig");
const cookieParser = require("cookie-parser");
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
      "https://shop.technologyheaven.in"
      "https://seller.technologyheaven.in",
      "https://register.technologyheaven.in"
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
      "https://shop.technologyheaven.in"
      "https://seller.technologyheaven.in",
      "https://register.technologyheaven.in"
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

// Socket.IO Integration
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

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
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
