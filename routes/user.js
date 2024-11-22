const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken, isVerified, checkRole } = require('../middleware/auth');


router.put('/:userId/role', authenticateToken, isVerified, UserController.updateUserRole);

router.get('/', authenticateToken, isVerified, checkRole('admin'), UserController.getUsersByRole);

router.put('/:userId/business-profile', authenticateToken, isVerified, UserController.updateBusinessProfile);


module.exports = router;