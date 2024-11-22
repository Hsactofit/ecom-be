const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const {logError} = require('../utils/logError'); // Logging utility

const wishlistService = {
    async getWishlist(userId) {
        try {
            const wishlist = await Wishlist.findOne({ userId })
                .populate('items.productId')
                .lean();
            return wishlist || { items: [] }; // Return empty items if no wishlist found
        } catch (error) {
            logError('getWishlist', error, { userId });
            throw new Error('Failed to retrieve wishlist');
        }
    },

    async addToWishlist(userId, productId) {
        try {
            // Find the wishlist and check if the product is already in the items array
            const existingWishlist = await Wishlist.findOne({ userId });
    
            if (existingWishlist && existingWishlist.items.some(item => item.productId.toString() === productId)) {
                throw new Error('Product is already in the wishlist');
            }
    
            // Add the product to the wishlist
            const updatedWishlist = await Wishlist.findOneAndUpdate(
                { userId },
                { $addToSet: { items: { productId } } }, // Prevent duplicates
                { upsert: true, new: true } // Create wishlist if not exists
            ).populate('items.productId');
    
            // Update the user's wishlist in the User schema (if applicable)
            await this.updateUserWishlist(userId, productId);
    
            return updatedWishlist;
        } catch (error) {
            logError('addToWishlist', error, { userId, productId });
    
            // If the error is due to the product already being in the wishlist, handle it
            if (error.message === 'Product is already in the wishlist') {
                return { success: false, message: error.message };
            }
    
            throw new Error('Failed to add product to wishlist');
        }
    },

    async removeFromWishlist(userId, productId) {
        try {
            // Find the wishlist and check if the product exists in the items array
            const existingWishlist = await Wishlist.findOne({ userId });
    
            if (!existingWishlist || !existingWishlist.items.some(item => item.productId.toString() === productId)) {
                throw new Error('Product is not in the wishlist');
            }
    
            // Remove the product from the wishlist
            const updatedWishlist = await Wishlist.findOneAndUpdate(
                { userId },
                { $pull: { items: { productId } } }, // Remove the product from items
                { new: true }
            ).populate('items.productId');
    
            // Update the user's wishlist in the User schema (if applicable)
            await this.updateUserWishlist(userId, productId, 'remove');
    
            return updatedWishlist;
        } catch (error) {
            logError('removeFromWishlist', error, { userId, productId });
    
            // If the error is due to the product not being in the wishlist, handle it
            if (error.message === 'Product is not in the wishlist') {
                return { success: false, message: error.message };
            }
    
            throw new Error('Failed to remove product from wishlist');
        }
    },

    async checkProductInWishlist(userId, productId) {
        try {
            const wishlist = await Wishlist.findOne({
                userId,
                'items.productId': productId
            });
            return !!wishlist; // Returns true if product is in wishlist, else false
        } catch (error) {
            logError('checkWishlistStatus', error, { userId, productId });
            throw new Error('Failed to check wishlist status');
        }
    },

    async clearWishlist(userId) {
        try {
            const clearedWishlist = await Wishlist.findOneAndUpdate(
                { userId },
                { $set: { items: [] } }, // Clear all items
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
                message: 'WishList cleared successfully',
                clearedWishlist
            };
        } catch (error) {
            logError('clearWishlist', error, { userId });
            throw new Error('Failed to clear wishlist');
        }
    },

    async updateUserWishlist(userId, productId, action = 'add') {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
    
            // Check if the product already exists in the user's wishlist
            const existingWishlistItem = user.wishlist.find(item => item.productId.toString() === productId);
    
            if (action === 'add') {
                if (!existingWishlistItem) {
                    // Add new product to user's wishlist
                    user.wishlist.push({ productId });
                } else {
                    throw new Error('Product already exists in wishlist');
                }
            } else if (action === 'remove') {
                if (existingWishlistItem) {
                    // Remove the product from the wishlist
                    user.wishlist = user.wishlist.filter(item => item.productId.toString() !== productId);
                } else {
                    throw new Error('Product not found in wishlist');
                }
            } else {
                throw new Error('Invalid action. Use "add" or "remove".');
            }
    
            // Save the updated user document
            await user.save();
            return user;
        } catch (error) {
            logError('updateUserWishlist', error, { userId, productId, action });
            throw error;
        }
    }

};

module.exports = wishlistService;
