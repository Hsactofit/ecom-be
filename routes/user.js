const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const { authenticateToken, checkRole } = require("../middleware/auth");

// ======================= Public Routes =======================

// Get user by ID (public route)
router.get("/", UserController.getUserById);

// ======================= Private Routes =======================

// Update user role (accessible by admin only)
router.put(
  "/:userId/role",
  authenticateToken,
  checkRole("admin"),
  UserController.updateUserRole
);

// Update business profile (accessible by authenticated users)
router.put(
  "/:userId/business-profile",
  UserController.updateBusinessProfile
);

// Accept user (accessible by admin only)
router.patch(
  "/:userId/accept",
  authenticateToken,
  checkRole("admin"),
  UserController.acceptUser
);

// Reject user (accessible by admin only)
router.patch(
  "/:userId/reject",
  authenticateToken,
  checkRole("admin"),
  UserController.rejectUser
);

// Get all sellers (accessible by admin only)
router.get(
  "/sellers",
  // authenticateToken,
  // checkRole("admin"),
  UserController.getAllSellers
);


router.get("/searchSellers", UserController.searchSellers);

module.exports = router;
