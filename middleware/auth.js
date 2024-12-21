// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = {
  // Verify JWT token
  authenticateToken: async (req, res, next) => {
    try {
      // console.log("my request", req);

      // Extract token from cookies
      const token = req.cookies["technology-heaven-token"];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Access token is required",
        });
      }

      console.log("My token:", token);

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user details from the database
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Attach user to the request object
      req.user = user;
      next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  },

  // Check if user is verified
  isVerified: async (req, res, next) => {
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email and phone first",
      });
    }
    next();
  },

  // Check user role
  checkRole: (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
        });
      }
      next();
    };
  },
};

module.exports = auth;
