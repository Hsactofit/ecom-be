const { validateObjectId } = require('../utils/validation');
const wishlistService = require('../services/wishlistService');

const wishlistController = {
    async getWishlist(req, res) {
        const { userId } = req.params;

        if (!validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        try {
            const wishlist = await wishlistService.getWishlist(userId);

            if (!wishlist || wishlist.items.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'Wishlist is empty'
                });
            }

            return res.status(200).json({
                success: true,
                data: wishlist.items,
                message: 'Wishlist retrieved successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to fetch wishlist'
            });
        }
    },

    async addToWishlist(req, res) {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Product ID are required'
            });
        }

        if (!validateObjectId(userId) || !validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or product ID format'
            });
        }

        try {
            const wishlist = await wishlistService.addToWishlist(userId, productId);

            if (!wishlist) {
                return res.status(404).json({
                    success: false,
                    message: 'Wishlist not found for user'
                });
            }

            return res.status(201).json({
                success: true,
                data: wishlist,
                message: 'Product added to wishlist successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to add product to wishlist'
            });
        }
    },

    async removeFromWishlist(req, res) {
        const { userId, productId } = req.params;

        if (!validateObjectId(userId) || !validateObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or product ID format'
            });
        }

        try {
            const wishlist = await wishlistService.removeFromWishlist(userId, productId);

            if (!wishlist) {
                return res.status(404).json({
                    success: false,
                    message: 'Wishlist not found or product not in wishlist'
                });
            }

            return res.status(200).json({
                success: true,
                data: wishlist,
                message: 'Product removed from wishlist successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to remove product from wishlist'
            });
        }
    },

    async clearWishlist(req, res) {
        const { userId } = req.params;

        if (!validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        try {
            const clearedWishlist = await wishlistService.clearWishlist(userId);

            if (!clearedWishlist) {
                return res.status(404).json({
                    success: false,
                    message: 'Wishlist not found for user'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Wishlist cleared successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to clear wishlist'
            });
        }
    },

    async checkProductInWishlist(req, res) {
        const { userId, productId } = req.params;

        // Validate input IDs
        if (!validateObjectId(userId) || !validateObjectId(productId)) {
            logError('checkProductInWishlist', 'Invalid user ID or product ID format', { userId, productId });
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID or product ID format'
            });
        }

        try {
            // Check if the product exists in the wishlist
            const isInWishlist = await wishlistService.checkProductInWishlist(userId, productId);

            if (isInWishlist) {
                return res.status(200).json({
                    success: true,
                    message: 'Product is in the wishlist',
                    data: { isInWishlist: true }
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Product is not in the wishlist',
                    data: { isInWishlist: false }
                });
            }
        } catch (error) {
            logError('checkProductInWishlist', error.message, { userId, productId });
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to check product in wishlist'
            });
        }
    }
};

module.exports = wishlistController;
