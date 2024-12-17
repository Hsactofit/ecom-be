// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = {
  // Verify JWT token
  authenticateToken: async (req, res, next) => {
    try {
      console.log("my request",req);
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
