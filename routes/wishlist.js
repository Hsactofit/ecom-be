const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/WishListController');

// Get wishlist for a user
router.get('/:userId', wishlistController.getWishlist);

// Add a product to the wishlist
router.post('/add', wishlistController.addToWishlist);

// Remove a product from the wishlist
router.delete('/:userId/:productId', wishlistController.removeFromWishlist);

// Clear the user's wishlist
router.delete('/:userId', wishlistController.clearWishlist);

// Export the router
module.exports = router;
