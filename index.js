const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const {
  auth_route,
  user_route,
  product_route,
  cart_route,
  order_route,
  cartRoute,
  wishlistRoute,
} = require("./routes");
const dbConfig = require("./config/database-config");
const {
  authenticationVerifier,
  accessLevelVerifier,
  isAdminVerifier,
} = require("./middlewares/verifyToken");

const app = express();

app.use(cors());

// Middleware
// app.use(
//   cors({
//     origin: "http://localhost:5173", // Replace with your frontend origin
//     credentials: true, // Allows cookies to be sent with requests
//   })
// );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/auth", auth_route); // Public routes
app.use("/api/v1/users", authenticationVerifier, user_route); // Protected routes
app.use("/api/v1/products", product_route); // Public routes
app.use("/api/v1/carts", cartRoute); // Protected routes
app.use("/api/v1/wishlist", wishlistRoute); // Protected routes
app.use("/api/v1/orders", authenticationVerifier, order_route); // Protected routes

// Database Connection
mongoose
  .connect(dbConfig.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to the database"))
  .catch((err) => {
    console.error("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ type: "error", message: "Something went wrong!" });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
