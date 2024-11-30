const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');


// Create order from cart
router.post('/from-cart', orderController.createOrderFromCart);

// Create order for a single product
router.post('/single-product', orderController.createOrderForSingleProduct);

// Get order by ID
router.get('/:orderId', orderController.getOrderById);

// Get all orders for a user
router.get('/user/:userId', orderController.getUserOrders);


// Get all orders for a seller
router.get('/seller/:sellerId', orderController.getSellerOrders);

router.put(
    '/:orderId/items/:itemId/status',
    orderController.updateProductOrderStatus
);

// Cancel an order
router.patch('/cancel', orderController.cancelOrder);

module.exports = router;
