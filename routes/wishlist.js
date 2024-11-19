const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/WishListController');

router.get('/:userId', wishlistController.getWishlist);
router.post('/add', wishlistController.addToWishlist);
router.delete('/:userId/item/:productId', wishlistController.removeFromWishlist);
router.get('/products/:userId', wishlistController.getProductsWithWishlistStatus);
router.delete('/clear/:userId', wishlistController.clearWishlist);

module.exports = router;