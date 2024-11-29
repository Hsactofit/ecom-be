const NegotiatedProduct = require('../models/NegotiatedProduct');
const { logError } = require('../utils/logError');

class NegotiatedProductService {
    async createNegotiatedProduct(productData) {
        try {
            if (!productData.seller || !productData.user || !productData.product) {
                throw new Error('Seller, user, and product IDs are required');
            }

            console.log('[NegotiatedProductService createNegotiatedProduct Started]:', {
                ...productData,
                timestamp: new Date().toISOString()
            });

            const negotiatedProduct = new NegotiatedProduct(productData);
            await negotiatedProduct.save();

            console.log('[NegotiatedProductService createNegotiatedProduct Success]:', {
                id: negotiatedProduct._id,
                timestamp: new Date().toISOString()
            });

            return negotiatedProduct;
        } catch (error) {
            logError('createNegotiatedProduct', error, productData);
            throw error;
        }
    }

    async getNegotiatedProduct(id) {
        try {
            console.log('[NegotiatedProductService getNegotiatedProduct Started]:', {
                id,
                timestamp: new Date().toISOString()
            });

            const negotiatedProduct = await NegotiatedProduct.findById(id)
                .populate('seller', '-password')
                .populate('user', '-password')
                .populate('product');

            if (!negotiatedProduct) {
                throw new Error('Negotiated product not found');
            }

            console.log('[NegotiatedProductService getNegotiatedProduct Success]:', {
                id,
                timestamp: new Date().toISOString()
            });

            return negotiatedProduct;
        } catch (error) {
            logError('getNegotiatedProduct', error, { id });
            throw error;
        }
    }

    async getNegotiatedProductsBySeller(sellerId) {
        try {
            console.log('[NegotiatedProductService getNegotiatedProductsBySeller Started]:', {
                sellerId,
                timestamp: new Date().toISOString()
            });

            const negotiations = await NegotiatedProduct.find({ seller: sellerId })
                .populate('product');

            console.log('[NegotiatedProductService getNegotiatedProductsBySeller Success]:', {
                sellerId,
                count: negotiations.length,
                timestamp: new Date().toISOString()
            });

            return negotiations;
        } catch (error) {
            logError('getNegotiatedProductsBySeller', error, { sellerId });
            throw error;
        }
    }

    async deleteNegotiatedProduct(id) {
        try {
            console.log('[NegotiatedProductService deleteNegotiatedProduct Started]:', {
                id,
                timestamp: new Date().toISOString()
            });

            const negotiatedProduct = await NegotiatedProduct.findByIdAndDelete(id);

            if (!negotiatedProduct) {
                throw new Error('Negotiated product not found');
            }

            console.log('[NegotiatedProductService deleteNegotiatedProduct Success]:', {
                id,
                timestamp: new Date().toISOString()
            });

            return negotiatedProduct;
        } catch (error) {
            logError('deleteNegotiatedProduct', error, { id });
            throw error;
        }
    }
}

module.exports = new NegotiatedProductService();