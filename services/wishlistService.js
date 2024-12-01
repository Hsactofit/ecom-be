const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const ProductGetService = require('../services/product/ProductSearchService');
const {logError} = require('../utils/logError'); // Logging utility

const wishlistService = {
    async getWishlist(userId) {
        try {
            const wishlist = await Wishlist.findOne({ userId }).lean();
            
            if (!wishlist) {
                return [];
            }
    
            const productsWithDetails = await Promise.all(
                wishlist.items.map(async (productId) => {
                    try {
                        const product = await ProductGetService.getProductById(productId);
                        return {
                            _id: productId,
                            productDetails: product
                        };
                    } catch (error) {
                        console.log(`Failed to fetch product details for productId: ${productId}`, error);
                        return {
                            _id: productId,
                            productDetails: null,
                            error: 'Product details unavailable'
                        };
                    }
                })
            );
    
            return {
                ...wishlist,
                items: productsWithDetails
            };
            
        } catch (error) {
            logError('getWishlist', error, { userId });
            throw new Error('Failed to retrieve wishlist');
        }
    },
    
    async addToWishlist(userId, productId) {
        try {
            // Check if product already exists in wishlist
            const existingWishlist = await Wishlist.findOne({ 
                userId,
                items: productId 
            });
    
            if (existingWishlist) {
                throw new Error('Product is already in the wishlist');
            }
    
            // Add the product to wishlist
            const updatedWishlist = await Wishlist.findOneAndUpdate(
                { userId },
                { $addToSet: { items: productId } }, // Using addToSet to prevent duplicates
                { upsert: true, new: true }
            );
    
            // Update user's wishlist if needed
            await this.updateUserWishlist(userId, productId);
    
            return updatedWishlist;
        } catch (error) {
            logError('addToWishlist', error, { userId, productId });
            
            if (error.message === 'Product is already in the wishlist') {
                return { success: false, message: error.message };
            }
    
            throw new Error('Failed to add product to wishlist');
        }
    },
    
    async removeFromWishlist(userId, productId) {
        try {
            const existingWishlist = await Wishlist.findOne({ 
                userId,
                items: productId
            });
    
            if (!existingWishlist) {
                throw new Error('Product is not in the wishlist');
            }
    
            // Remove product from wishlist
            const updatedWishlist = await Wishlist.findOneAndUpdate(
                { userId },
                { $pull: { items: productId } },
                { new: true }
            );
    
            // Update user's wishlist if needed
            await this.updateUserWishlist(userId, productId, 'remove');
    
            return updatedWishlist;
        } catch (error) {
            logError('removeFromWishlist', error, { userId, productId });
    
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
                items: productId
            });
            return !!wishlist;
        } catch (error) {
            logError('checkWishlistStatus', error, { userId, productId });
            throw new Error('Failed to check wishlist status');
        }
    },
    
    async clearWishlist(userId) {
        try {
            const clearedWishlist = await Wishlist.findOneAndUpdate(
                { userId },
                { $set: { items: [] } },
                { new: true }
            );
    
            // Clear user's wishlist if needed
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
    
            user.wishlist = []; // Clear user's wishlist array
            await user.save();
    
            return {
                message: 'Wishlist cleared successfully',
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
    
            const existingProduct = user.wishlist.filter(id => id.toString() === productId);
    
            if (action === 'add') {
                if (!existingProduct) {
                    user.wishlist.push(productId);
                } else {
                    throw new Error('Product already exists in wishlist');
                }
            } else if (action === 'remove') {
                if (existingProduct) {
                    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
                } else {
                    throw new Error('Product not found in wishlist');
                }
            } else {
                throw new Error('Invalid action. Use "add" or "remove".');
            }
    
            await user.save();
            return user;
        } catch (error) {
            logError('updateUserWishlist', error, { userId, productId, action });
            throw error;
        }
    }

};

module.exports = wishlistService;
