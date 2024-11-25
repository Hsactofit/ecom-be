const Product = require('../../models/Product');
const ResellProduct = require('../../models/ResellProduct');
const { logError } = require('../../utils/logError');

class ProductSearchService {
    // Helper to format seller information
    _formatSellerInfo(seller) {
        if (!seller) return null;
        return {
            name: seller.name || '',
            phone: seller.phone || ''
        };
    }

    // Transform product document into standardized response format
    _normalizeProductResponse(product, isResell = false, resellData = null) {
        if (!product) return null;

        const baseProduct = product.toObject ? product.toObject() : product;

        const normalized = {
            _id: isResell ? resellData._id : baseProduct._id,
            seller: this._formatSellerInfo(isResell ? resellData.seller : baseProduct.seller),
            title: isResell ? resellData.title : baseProduct.title,
            slug: isResell ? resellData.slug : baseProduct.slug,
            description: baseProduct.description || '',
            images: baseProduct.images || [],
            category: baseProduct.category,
            specifications: {
                memoryType: baseProduct.specifications?.memoryType || null,
                clockSpeed: baseProduct.specifications?.clockSpeed || null,
                interface: baseProduct.specifications?.interface || null,
                hashRate: baseProduct.specifications?.hashRate || null,
                powerConsumption: baseProduct.specifications?.powerConsumption || null,
                algorithm: baseProduct.specifications?.algorithm || [],
                supportedCoins: baseProduct.specifications?.supportedCoins || []
            },
            variants: isResell ? resellData.variants : baseProduct.variants,
            rating: baseProduct.rating || { average: 0, reviews: [] },
            brand: baseProduct.brand,
            status: isResell ? resellData.status : baseProduct.status,
            warranty: baseProduct.warranty || {},
            createdAt: isResell ? resellData.createdAt : baseProduct.createdAt,
            updatedAt: isResell ? resellData.updatedAt : baseProduct.updatedAt
        };

        if (isResell) {
            normalized.originalProduct = {
                _id: baseProduct._id,
                seller: this._formatSellerInfo(baseProduct.seller),
                title: baseProduct.title
            };
            normalized.isResell = true;
        } else {
            normalized.isResell = false;
        }

        return normalized;
    }

    async getProductById(productId) {
        try {
            if (!productId) {
                throw new Error('Product ID is required');
            }

            const logContext = {
                productId,
                timestamp: new Date().toISOString()
            };

            console.log('[ProductSearchService getProductById Started]:', logContext);

            // Try to find original product
            let product = await Product.findOne({
                _id: productId,
                status: { $ne: 'deleted' }
            }).populate('seller', 'name phone'); // Only populate name and phone

            if (product) {
                console.log('[ProductSearchService getProductById Success]:', {
                    ...logContext,
                    isResell: false
                });
                return this._normalizeProductResponse(product, false);
            }

            // Check resell products
            const resellProduct = await ResellProduct.findOne({
                _id: productId,
                status: { $ne: 'deleted' }
            }).populate([
                {
                    path: 'originalProduct',
                    match: { status: 'active' },
                    populate: {
                        path: 'seller',
                        select: 'name phone'
                    }
                },
                {
                    path: 'seller',
                    select: 'name phone'
                }
            ]);

            if (!resellProduct?.originalProduct) {
                throw new Error('Product not found');
            }

            console.log('[ProductSearchService getProductById Success]:', {
                ...logContext,
                isResell: true
            });

            return this._normalizeProductResponse(
                resellProduct.originalProduct,
                true,
                resellProduct
            );
        } catch (error) {
            logError('getProductById', error, { productId });
            throw error;
        }
    }

    async searchProducts(searchQuery, options = {}) {
        try {
            const {
                page = 1,
                limit = 6,
                category,
                brand,
                minPrice,
                maxPrice,
                sortBy = 'createdAt',
                sortOrder = -1,
                includeResell = true
            } = options;

            const logContext = {
                searchQuery,
                options,
                timestamp: new Date().toISOString()
            };

            console.log('[ProductSearchService searchProducts Started]:', logContext);

            const baseQuery = this._buildBaseQuery(searchQuery, category, brand);
            const priceQuery = this._buildPriceQuery(minPrice, maxPrice);

            // Fetch products
            const [originalProducts, resellProducts] = await Promise.all([
                Product.find({
                    ...baseQuery,
                    ...priceQuery
                })
                    .populate('seller', 'name phone')
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ [sortBy]: sortOrder }),

                includeResell ? ResellProduct.find({
                    ...baseQuery,
                    ...priceQuery
                })
                    .populate([
                        {
                            path: 'originalProduct',
                            match: { status: 'active' },
                            populate: {
                                path: 'seller',
                                select: 'name phone'
                            }
                        },
                        {
                            path: 'seller',
                            select: 'name phone'
                        }
                    ])
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ [sortBy]: sortOrder }) : []
            ]);

            // Normalize all products
            let combinedProducts = [
                ...originalProducts.map(p => this._normalizeProductResponse(p, false)),
                ...resellProducts
                    .filter(rp => rp.originalProduct)
                    .map(rp => this._normalizeProductResponse(rp.originalProduct, true, rp))
            ];

            // Sort and paginate
            combinedProducts = this._sortProducts(combinedProducts, sortBy, sortOrder);
            const total = combinedProducts.length;
            combinedProducts = combinedProducts.slice((page - 1) * limit, page * limit);

            console.log('[ProductSearchService searchProducts Success]:', {
                ...logContext,
                totalResults: combinedProducts.length,
                originalCount: originalProducts.length,
                resellCount: resellProducts.length
            });

            return {
                products: combinedProducts,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logError('searchProducts', error, {
                searchQuery,
                options: JSON.stringify(options)
            });
            throw error;
        }
    }

    _buildBaseQuery(searchQuery, category, brand) {
        const query = { status: { $ne: 'deleted' } };
        if (searchQuery) query.title = { $regex: searchQuery, $options: 'i' };
        if (category) query.category = category;
        if (brand) query.brand = brand;
        return query;
    }

    _buildPriceQuery(minPrice, maxPrice) {
        if (!minPrice && !maxPrice) return {};

        const priceQuery = { 'variants.price': {} };
        if (minPrice) priceQuery['variants.price'].$gte = Number(minPrice);
        if (maxPrice) priceQuery['variants.price'].$lte = Number(maxPrice);
        return priceQuery;
    }

    _sortProducts(products, sortBy, sortOrder) {
        return [...products].sort((a, b) => {
            if (sortBy === 'price') {
                const aPrice = Math.min(...a.variants.map(v => v.price));
                const bPrice = Math.min(...b.variants.map(v => v.price));
                return (aPrice - bPrice) * sortOrder;
            }
            return (a[sortBy] - b[sortBy]) * sortOrder;
        });
    }
}

module.exports = new ProductSearchService();