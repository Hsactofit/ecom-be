const cartService = require('../services/cartService');
const ProductSearchService = require('../services/product/ProductSearchService');

const cartController = {
    async getCart(req, res) {
        try {
            const cart = await cartService.getUserCart(req.params.userId);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Cart is empty',
                    data: [],
                    cartTotal: 0
                });
            }
            res.status(200).json({
                success: true,
                message: 'Cart retrieved successfully',
                data: cart.items,
                cartTotal: cart.cartTotal
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to retrieve cart', error: error.message });
        }
    },

    async addToCart(req, res) {
        try {
            let { userId, productId, quantity, productPrice } = req.body;
            
            const variantIndex = parseInt(req.body.variantIndex) || 0;
            if (!userId || !productId || typeof variantIndex !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'UserId, productId, and variantIndex are required'
                });
            }
            const cart = await cartService.addItem(userId, productId, variantIndex || 0, quantity || 1, productPrice);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Cart is empty after addition',
                    data: [],
                    cartTotal: 0
                });
            }

            // Get updated cart with calculated totals
            const updatedCart = await cartService.getUserCart(userId);

            res.status(200).json({
                success: true,
                message: 'Item added to cart',
                data: updatedCart.items,
                cartTotal: updatedCart.cartTotal
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add item to cart', error: error.message });
        }
    },

    async updateCartItem(req, res) {
        try {
            const { userId, productId, variantIndex, quantity, productPrice } = req.body;
            if (!userId || !productId || typeof variantIndex !== 'number' || quantity === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'UserId, productId, variantIndex, and quantity are required'
                });
            }
            const cart = await cartService.updateItem(userId, productId, variantIndex, quantity, productPrice);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Cart is empty after update',
                    data: [],
                    cartTotal: 0
                });
            }

            // Get updated cart with calculated totals
            const updatedCart = await cartService.getUserCart(userId);

            res.status(200).json({
                success: true,
                message: 'Cart item updated successfully',
                data: updatedCart.items,
                cartTotal: updatedCart.cartTotal
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update cart item', error: error.message });
        }
    },

    async removeFromCart(req, res) {
        try {
            const { userId, productId } = req.body;
            const variantIndex = parseInt(req.body.variantIndex) || 0;
            console.log(userId, productId, variantIndex);
            if (!userId || !productId || isNaN(variantIndex)) {
                return res.status(400).json({
                    success: false,
                    message: 'UserId, productId, and variantIndex are required'
                });
            }
            const cart = await cartService.removeItem(userId, productId, variantIndex);
            if (!cart || cart.items.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Cart is empty after removal',
                    data: [],
                    cartTotal: 0
                });
            }

            // Get updated cart with calculated totals
            const updatedCart = await cartService.getUserCart(userId);

            res.status(200).json({
                success: true,
                message: 'Item removed from cart',
                data: updatedCart.items,
                cartTotal: updatedCart.cartTotal
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to remove item from cart', error: error.message });
        }
    },

    async isProductInCart(req, res) {
        try {
            const { userId, productId } = req.params;
            const variantIndex = parseInt(req.params.variantIndex);

            if (!userId || !productId || isNaN(variantIndex)) {
                return res.status(400).json({
                    success: false,
                    message: 'UserId, productId, and variantIndex are required'
                });
            }
            const result = await cartService.checkItemInCart(userId, productId, variantIndex);
            res.status(200).json({
                success: true,
                message: result.inCart ? 'Product is in the cart' : 'Product is not in the cart',
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to check product in cart', error: error.message });
        }
    },

    async getCartItems(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'UserId is required'
                });
            }
            const cartItems = await cartService.getCartItems(userId);
            if (!cartItems || !cartItems.items.length) {
                return res.status(200).json({
                    success: true,
                    message: 'Cart is empty',
                    data: []
                });
            }
            res.status(200).json({
                success: true,
                message: 'Cart items retrieved successfully',
                data: cartItems.items
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to get cart items', error: error.message });
        }
    },

    async clearCart(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'UserId is required'
                });
            }
            const result = await cartService.clearCart(userId);
            res.status(200).json({
                success: true,
                message: 'Cart cleared successfully',
                data: result
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to clear cart', error: error.message });
        }
    },

    async markCartCompleted(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'UserId is required'
                });
            }
            const completedCart = await cartService.markCartAsCompleted(userId);
            if (!completedCart) {
                return res.status(404).json({
                    success: false,
                    message: 'No active cart found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Cart marked as completed',
                data: completedCart
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to mark cart as completed', error: error.message });
        }
    }
};

module.exports = cartController;