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
            return res.status(200).json({
                success: true,
                data: wishlist?.items || [],
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

    async getProductsWithWishlistStatus(req, res) {
        const { userId } = req.params;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        if (!validateObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page and limit must be positive numbers'
            });
        }

        try {
            const result = await wishlistService.getProductsWithWishlistStatus(userId, page || 1, limit || 10);
            return res.status(200).json({
                success: true,
                data: result,
                message: 'Products retrieved successfully'
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Failed to fetch products'
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
            await wishlistService.clearWishlist(userId);
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
    }
};

module.exports = wishlistController;