// routes/auth.js
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const {
  authenticateToken,
  isVerified,
  checkRole,
} = require("../middleware/auth");

// Public routes
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/google/signin", AuthController.googleSignIn);
router.get("/verify-email/:token", AuthController.verifyEmail);
router.post("/verify-phone", AuthController.verifyPhone);

// Protected routes
router.post(
  "/resend-verification",
  authenticateToken,
  AuthController.resendVerification
);

router.post("/relogin", AuthController.relogin);

router.get(
  "/get-logged-in-user-details",
  authenticateToken,
  AuthController.getLoggedInUserDetails
);

// Example of protected routes with role check
// router.get('/admin/users', authenticateToken, isVerified, checkRole('admin'), AuthController.getAllUsers);
// router.get('/seller/dashboard', authenticateToken, isVerified, checkRole('seller', 'reseller'), AuthController.getSellerDashboard);

module.exports = router;
