const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');

// Get cart items for a user
router.get('/:userId', cartController.getCart);

// Get specific cart items
router.get('/items/:userId', cartController.getCartItems);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item
router.put('/update', cartController.updateCartItem);

// Remove item from cart (now includes variantIndex)
router.delete('/:userId/item/:productId/:variantIndex', cartController.removeFromCart);

// Check if product variant in cart
router.get('/:userId/check/:productId/:variantIndex', cartController.isProductInCart);

// Clear cart
router.delete('/clear/:userId', cartController.clearCart);

// Mark cart as completed
router.put('/:userId/complete', cartController.markCartCompleted);

module.exports = router;