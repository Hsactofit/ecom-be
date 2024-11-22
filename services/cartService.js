const Cart = require("../models/Cart");
const User = require("../models/User");

const { logError } = require('../utils/logError');

const cartService = {
    async getUserCart(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
            const cart = await Cart.findOne({ userId, status: 'active' })
                .populate('items.productId')
                .lean();
            return cart;
        } catch (error) {
            logError('getUserCart', error, { userId });
            throw error;
        }
    },

    async addItem(userId, productId, quantity = 1) {
        try {
            if (!userId || !productId || typeof quantity !== 'number') {
                throw new Error('Invalid input for adding item');
            }
    
            const cart = await Cart.findOne({ userId, status: 'active' });
    
            if (cart) {
                // Check if the product already exists in the cart
                const existingItem = cart.items.find(item => item.productId.toString() === productId);
    
                if (existingItem) {
                    // Update quantity of the existing product
                    existingItem.quantity += quantity;
                } else {
                    // Add a new product to the cart
                    cart.items.push({ productId, quantity });
                }
    
                // Save the updated cart
                const updatedCart = await cart.save();
                await updatedCart.populate('items.productId');
                await this.updateUserCart(userId, productId, quantity);
                console.log(updatedCart);
                return updatedCart;
            } else {
                // Create a new cart if it doesn't exist
                const newCart = new Cart({
                    userId,
                    status: 'active',
                    items: [{ productId, quantity }]
                });
                const savedCart = await newCart.save();
                await savedCart.populate('items.productId');
                await this.updateUserCart(userId, productId, quantity);
                return savedCart;
            }
        } catch (error) {
            logError('addItem', error, { userId, productId, quantity });
            throw error;
        }
    },

    async updateItem(userId, productId, quantity) {
        try {
            if (!userId || !productId || typeof quantity !== 'number') {
                throw new Error('Invalid input for updating item');
            }
            if (quantity <= 0) {
                return this.removeItem(userId, productId);
            }
            const updatedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active', 'items.productId': productId },
                { $set: { 'items.$.quantity': quantity } },
                { new: true }
            ).populate('items.productId');
            await this.updateUserCart(userId, productId, quantity);
            return updatedCart;
        } catch (error) {
            logError('updateItem', error, { userId, productId, quantity });
            throw error;
        }
    },

    async removeItem(userId, productId) {
        try {
            if (!userId || !productId) {
                throw new Error('Invalid input for removing item');
            }
            const updatedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active' },
                { $pull: { items: { productId } } },
                { new: true }
            ).populate('items.productId');
            await this.updateUserCart(userId, productId, quantity = 0);
            return updatedCart;
        } catch (error) {
            logError('removeItem', error, { userId, productId });
            throw error;
        }
    },

    async checkItemInCart(userId, productId) {
        try {
            if (!userId || !productId) {
                throw new Error('Invalid input for checking item');
            }
            const cart = await Cart.findOne({
                userId,
                status: 'active',
                'items.productId': productId
            });
            const inCart = !!cart;
            const quantity = cart?.items.find(item =>
                item.productId.toString() === productId
            )?.quantity || 0;
            return { inCart, quantity };
        } catch (error) {
            logError('checkItemInCart', error, { userId, productId });
            throw error;
        }
    },

    async getCartItems(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
            const cartItems = await Cart.findOne(
                { userId, status: 'active' },
                { 'items.productId': 1, 'items.quantity': 1 }
            ).lean();
            return cartItems;
        } catch (error) {
            logError('getCartItems', error, { userId });
            throw error;
        }
    },

    async clearCart(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
    
            // Clear the cart in the Cart collection
            const clearedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active' },
                { $set: { items: [] } },
                { new: true }
            );
    
            // Clear the user's cart in the User schema
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
    
            user.cart = []; // Clear the user's cart array
            await user.save();
    
            return {
                message: 'Cart cleared successfully',
                clearedCart
            };
        } catch (error) {
            logError('clearCart', error, { userId });
            throw error;
        }
    },

    async markCartAsCompleted(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
            const completedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active' },
                { status: 'completed' },
                { new: true }
            );
            return completedCart;
        } catch (error) {
            logError('markCartAsCompleted', error, { userId });
            throw error;
        }
    },
    
    async updateUserCart(userId, productId, quantity = 1) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if the product already exists in the user's cart
            const existingCartItem = user.cart.find(item => item.productId.toString() === productId);
            if (existingCartItem) {
                if (quantity <= 0) {
                    // Remove the product from the cart if quantity is zero or less
                    user.cart = user.cart.filter(item => item.productId.toString() !== productId);
                } else {
                    // Update quantity
                    existingCartItem.quantity = quantity;
                }
            } else {
                // Add new product to user's cart
                user.cart.push({ productId, quantity });
            }

            // Save the updated user document
            await user.save();
            return user;
        } catch (error) {
            logError('updateUserCart', error, { userId, productId, quantity });
            throw error;
        }
    }
    
};

module.exports = cartService;