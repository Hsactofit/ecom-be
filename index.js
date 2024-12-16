const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const routes = require("./routes/index");
const config = require("./config/appConfig");
const cookieParser = require("cookie-parser");
const serverless = require("serverless-http"); // Add this
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware"); // Add this

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(awsServerlessExpressMiddleware.eventContext()); // Add this

app.use(
    cors({
      origin: [
        config.server.frontendUrl || "*",
        "http://localhost:5175",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
      ],
      credentials: true,
    })
);

app.use(express.urlencoded({ extended: true }));
app.use(routes);

// Database Connection
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(config.database.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Successfully connected to the database");
};

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

// Add Lambda handler
exports.handler = async (event, context) => {
  await connectDB();
  return await serverless(app)(event, context);
};