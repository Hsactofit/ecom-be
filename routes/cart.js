const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');

// Get cart items
router.get('/:userId', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/:userId/item/:productId', cartController.removeFromCart);

// Check if product in cart
router.get('/:userId/check/:productId', cartController.isProductInCart);

router.delete('/clear/:userId', cartController.clearCart);

module.exports = router;