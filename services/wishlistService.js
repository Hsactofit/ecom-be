const Wishlist = require('../models/Wishlist');
// wishlistService.js
const wishlistService = {
    async getWishlist(userId) {
        return Wishlist.findOne({ userId })
            .populate('items.productId')
            .lean();
    },

    async addToWishlist(userId, productId) {
        return Wishlist.findOneAndUpdate(
            { userId },
            { $addToSet: { items: { productId } } },
            { upsert: true, new: true }
        ).populate('items.productId');
    },

    async removeFromWishlist(userId, productId) {
        return Wishlist.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } },
            { new: true }
        ).populate('items.productId');
    },

    async checkWishlistStatus(userId, productId) {
        const wishlist = await Wishlist.findOne({
            userId,
            'items.productId': productId
        });
        return !!wishlist;
    },

    async clearWishlist(userId) {
        return Wishlist.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { new: true }
        );
    },

    async getProductsWithWishlistStatus(userId, page, limit) {
        const wishlist = await Wishlist.findOne(
            { userId },
            { 'items.productId': 1 }
        ).lean();

        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product.find().skip(skip).limit(limit).lean(),
            Product.countDocuments()
        ]);

        const wishlistIds = wishlist?.items.map(item => 
            item.productId.toString()
        ) || [];

        return {
            products: products.map(product => ({
                ...product,
                isInWishlist: wishlistIds.includes(product._id.toString())
            })),
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }
};

module.exports = wishlistService;