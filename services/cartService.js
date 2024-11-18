const Cart = require("../models/Cart");

const cartService = {
    async getUserCart(userId) {
        return Cart.findOne({ userId, status: 'active' })
            .populate('items.productId')
            .lean();
    },

    async addItem(userId, productId, quantity = 1) {
        return Cart.findOneAndUpdate(
            { userId, status: 'active' },
            { $push: { items: { productId, quantity } } },
            { upsert: true, new: true }
        ).populate('items.productId');
    },

    async updateItem(userId, productId, quantity) {
        if (quantity <= 0) {
            return this.removeItem(userId, productId);
        }
        return Cart.findOneAndUpdate(
            { userId, status: 'active', 'items.productId': productId },
            { $set: { 'items.$.quantity': quantity } },
            { new: true }
        ).populate('items.productId');
    },

    async removeItem(userId, productId) {
        return Cart.findOneAndUpdate(
            { userId, status: 'active' },
            { $pull: { items: { productId } } },
            { new: true }
        ).populate('items.productId');
    },

    async checkItemInCart(userId, productId) {
        const cart = await Cart.findOne({
            userId,
            status: 'active',
            'items.productId': productId
        });
        return {
            inCart: !!cart,
            quantity: cart?.items.find(item => 
                item.productId.toString() === productId
            )?.quantity || 0
        };
    },

    async getCartItems(userId) {
        return Cart.findOne(
            { userId, status: 'active' },
            { 'items.productId': 1, 'items.quantity': 1 }
        ).lean();
    },
    async clearCart(userId) {
        return Cart.findOneAndUpdate(
            { userId, status: 'active' },
            { $set: { items: [] } },
            { new: true }
        );
    },
    async markCartAsCompleted(userId) {
        return Cart.findOneAndUpdate(
            { userId, status: 'active' },
            { status: 'completed' },
            { new: true }
        );
    },

};


module.exports = cartService;