const Product = require("../models/Product");
const cartService = require('../services/cartService');
const cartController = {
    async getCart(req, res) {
        try {
            const cart = await cartService.getUserCart(req.params.userId);
            res.json(cart?.items || []);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async addToCart(req, res) {
        try {
            const { userId, productId, quantity } = req.body;
            const cart = await cartService.addItem(userId, productId, quantity);
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateCartItem(req, res) {
        try {
            const { userId, productId, quantity } = req.body;
            const cart = await cartService.updateItem(userId, productId, quantity);
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async removeFromCart(req, res) {
        try {
            const cart = await cartService.removeItem(
                req.params.userId, 
                req.params.productId
            );
            res.json(cart);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async isProductInCart(req, res) {
        try {
            const result = await cartService.checkItemInCart(
                req.params.userId, 
                req.params.productId
            );
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getProductsWithCartStatus(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const cart = await cartService.getCartItems(req.params.userId);
            const cartItems = cart?.items || [];

            const [products, total] = await Promise.all([
                Product.find().skip(skip).limit(limit).lean(),
                Product.countDocuments()
            ]);

            const productsWithCartInfo = products.map(product => {
                const cartItem = cartItems.find(item => 
                    item.productId.toString() === product._id.toString()
                );
                return {
                    ...product,
                    inCart: !!cartItem,
                    quantity: cartItem?.quantity || 0
                };
            });

            res.json({
                products: productsWithCartInfo,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    async clearCart(req, res) {
        try {
            const cart = await cartService.clearCart(req.params.userId);
            res.json({ success: true, message: 'Cart cleared successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cartController;