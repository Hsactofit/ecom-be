const Product = require('../../models/Product');
const ResellProduct = require('../../models/ResellProduct');
const { logError } = require('../../utils/logError');

class ResellProductService {

    async createResellProduct(originalProductId, sellerId, title, variants) {
        try {
            if (!originalProductId || !sellerId || !title || !variants?.length) {
                throw new Error('Original product ID, seller ID, title, and variants are required');
            }

            console.log('[ResellProductService createResellProduct Started]:', {
                originalProductId,
                sellerId,
                title,
                variantsCount: variants.length,
                timestamp: new Date().toISOString()
            });

            // Check if original product exists and is active
            const originalProduct = await Product.findOne({
                _id: originalProductId,
                status: 'active'
            });

            if (!originalProduct) {
                throw new Error('Original product not found or inactive');
            }

            // Check if seller already has a resell listing for this product
            const existingResell = await ResellProduct.findOne({
                originalProduct: originalProductId,
                seller: sellerId
            });

            if (existingResell) {
                throw new Error('You already have a resell listing for this product');
            }

            // Check for title uniqueness for this seller
            const existingTitle = await ResellProduct.findOne({
                seller: sellerId,
                title: title
            });

            if (existingTitle) {
                throw new Error('You already have a product with this title');
            }

            // Validate variants against original product
            if (variants.length !== originalProduct.variants.length) {
                throw new Error('Number of variants must match the original product');
            }

            // Validate variant prices
            for (const variant of variants) {
                const originalVariant = originalProduct.variants.find(
                    v => v.memorySize.size === variant.memorySize.size &&
                        v.memorySize.unit === variant.memorySize.unit
                );

                if (!originalVariant) {
                    throw new Error(`Invalid variant configuration: ${variant.memorySize.size}${variant.memorySize.unit}`);
                }

                if (variant.price < originalVariant.price) {
                    throw new Error(`Resell price cannot be lower than original price for variant: ${variant.memorySize.size}${variant.memorySize.unit}`);
                }
            }

            const resellProduct = new ResellProduct({
                originalProduct: originalProductId,
                seller: sellerId,
                title,
                variants: variants,
                status: 'active'
            });

            await resellProduct.save();

            console.log('[ResellProductService createResellProduct Success]:', {
                resellProductId: resellProduct._id,
                originalProductId,
                sellerId,
                timestamp: new Date().toISOString()
            });

            return resellProduct;
        } catch (error) {
            logError('createResellProduct', error, {
                originalProductId,
                sellerId,
                title,
                variantsCount: variants?.length
            });
            throw error;
        }
    }

    async updateResellProduct(resellProductId, sellerId, updateData) {
        try {
            if (!resellProductId || !sellerId || !updateData) {
                throw new Error('Resell product ID, seller ID, and update data are required');
            }

            const { title, variants } = updateData;

            console.log('[ResellProductService updateResellProduct Started]:', {
                resellProductId,
                sellerId,
                updateFields: Object.keys(updateData),
                timestamp: new Date().toISOString()
            });

            // Find resell product and validate ownership
            const resellProduct = await ResellProduct.findOne({
                _id: resellProductId,
                seller: sellerId,
                status: { $ne: 'deleted' }
            }).populate('originalProduct');

            if (!resellProduct) {
                throw new Error('Resell product not found or unauthorized');
            }

            // Validate original product is still active
            if (resellProduct.originalProduct.status !== 'active') {
                throw new Error('Original product is no longer active');
            }

            // Check title uniqueness if title is being updated
            if (title && title !== resellProduct.title) {
                const existingTitle = await ResellProduct.findOne({
                    seller: sellerId,
                    title: title,
                    _id: { $ne: resellProductId }
                });

                if (existingTitle) {
                    throw new Error('You already have a product with this title');
                }
            }

            // Validate variant prices if variants are being updated
            if (variants) {
                if (variants.length !== resellProduct.originalProduct.variants.length) {
                    throw new Error('Number of variants must match the original product');
                }

                for (const variant of variants) {
                    const originalVariant = resellProduct.originalProduct.variants.find(
                        v => v.memorySize.size === variant.memorySize.size &&
                            v.memorySize.unit === variant.memorySize.unit
                    );

                    if (!originalVariant) {
                        throw new Error(`Invalid variant configuration: ${variant.memorySize.size}${variant.memorySize.unit}`);
                    }

                    if (variant.price < originalVariant.price) {
                        throw new Error(`Resell price cannot be lower than original price for variant: ${variant.memorySize.size}${variant.memorySize.unit}`);
                    }
                }
            }

            const updatedResellProduct = await ResellProduct.findByIdAndUpdate(
                resellProductId,
                {
                    $set: {
                        ...(title && { title }),
                        ...(variants && { variants })
                    }
                },
                { new: true, runValidators: true }
            );

            console.log('[ResellProductService updateResellProduct Success]:', {
                resellProductId,
                sellerId,
                timestamp: new Date().toISOString()
            });

            return updatedResellProduct;
        } catch (error) {
            logError('updateResellProduct', error, {
                resellProductId,
                sellerId,
                updateData: JSON.stringify(updateData)
            });
            throw error;
        }
    }

    async deleteResellProduct(resellProductId, sellerId) {
        try {
            if (!resellProductId || !sellerId) {
                throw new Error('Resell product ID and seller ID are required');
            }

            console.log('[ResellProductService deleteResellProduct Started]:', {
                resellProductId,
                sellerId,
                timestamp: new Date().toISOString()
            });

            const resellProduct = await ResellProduct.findOneAndUpdate(
                {
                    _id: resellProductId,
                    seller: sellerId,
                    status: { $ne: 'deleted' }
                },
                { $set: { status: 'deleted' } },
                { new: true }
            );

            if (!resellProduct) {
                throw new Error('Resell product not found or unauthorized');
            }

            console.log('[ResellProductService deleteResellProduct Success]:', {
                resellProductId,
                sellerId,
                timestamp: new Date().toISOString()
            });

            return resellProduct;
        } catch (error) {
            logError('deleteResellProduct', error, {
                resellProductId,
                sellerId
            });
            throw error;
        }
    }
}

module.exports = new ResellProductService();