const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/WishListController');

// Get wishlist for a user
router.get('/:userId', wishlistController.getWishlist);

// Add a product to the wishlist
router.post('/', wishlistController.addToWishlist);

// Remove a product from the wishlist
router.delete('/', wishlistController.removeFromWishlist);

// Clear the user's wishlist
router.delete('/:userId', wishlistController.clearWishlist);

// Chk product in wishlist
router.get('/:userId/check/:productId', wishlistController.checkProductInWishlist);


// Export the router
module.exports = router;
