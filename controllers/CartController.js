const cartService = require('../services/cartService');

const cartController = {
    async getCart(req, res) {
        try {
            const cart = await cartService.getUserCart(req.params.userId);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({ success: true, message: 'Cart is empty', data: [] });
            }
            res.status(200).json({ success: true, message: 'Cart retrieved successfully', data: cart.items });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to retrieve cart', error: error.message });
        }
    },

    async addToCart(req, res) {
        try {
            const { userId, productId, quantity } = req.body;
            if (!userId || !productId) {
                return res.status(400).json({ success: false, message: 'UserId and productId are required' });
            }
            const cart = await cartService.addItem(userId, productId, quantity);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({ success: true, message: 'Cart is empty after addition', data: [] });
            }
            res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add item to cart', error: error.message });
        }
    },

    async updateCartItem(req, res) {
        try {
            const { userId, productId, quantity } = req.body;
            if (!userId || !productId || quantity === undefined) {
                return res.status(400).json({ success: false, message: 'UserId, productId, and quantity are required' });
            }
            const cart = await cartService.updateItem(userId, productId, quantity);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({ success: true, message: 'Cart is empty after update', data: [] });
            }
            res.status(200).json({ success: true, message: 'Cart item updated successfully', data: cart });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update cart item', error: error.message });
        }
    },

    async removeFromCart(req, res) {
        try {
            const { userId, productId } = req.params;
            if (!userId || !productId) {
                return res.status(400).json({ success: false, message: 'UserId and productId are required' });
            }
            const cart = await cartService.removeItem(userId, productId);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({ success: true, message: 'Cart is empty after removal', data: [] });
            }
            res.status(200).json({ success: true, message: 'Item removed from cart', data: cart });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to remove item from cart', error: error.message });
        }
    },

    async isProductInCart(req, res) {
        try {
            const { userId, productId } = req.params;
            if (!userId || !productId) {
                return res.status(400).json({ success: false, message: 'UserId and productId are required' });
            }
            const result = await cartService.checkItemInCart(userId, productId);
            res.status(200).json({
                success: true,
                message: result.inCart ? 'Product is in the cart' : 'Product is not in the cart',
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to check product in cart', error: error.message });
        }
    },

    async clearCart(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ success: false, message: 'UserId is required' });
            }
            const cart = await cartService.clearCart(userId);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({ success: true, message: 'Cart is already empty', data: [] });
            }
            res.status(200).json({ success: true, message: 'Cart cleared successfully', data: cart });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to clear cart', error: error.message });
        }
    }
};

module.exports = cartController;
