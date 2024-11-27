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
            isVerified: baseProduct.isVerified || false,
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
            variants: (isResell ? resellData.variants : baseProduct.variants)?.map(variant => ({
                memorySize: variant.memorySize || null,
                price: variant.price || 0,
                minPrice: variant.minPrice || 10000000,
                minQuantity: variant.minQuantity || 100,
                stock: variant.stock || 0,
                discount: variant.discount || null
            })) || [],
            rating: baseProduct.rating || { average: 0, reviews: [] },
            brand: baseProduct.brand,
            status: isResell ? resellData.status : baseProduct.status,
            warranty: baseProduct.warranty || {},
            quantity: baseProduct.quantity || 1,
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
            // Ensure page and limit are numbers with default values
            const {
                page = 1,
                limit = 9,
                category,
                brand,
                minPrice,
                maxPrice,
                sortBy = 'createdAt',
                sortOrder = -1,
                includeResell = true
            } = options;

            // Convert to numbers and ensure positive values
            const pageNum = Math.max(1, Number(page));
            const limitNum = Math.max(1, Number(limit));
            const skip = (pageNum - 1) * limitNum;

            const logContext = {
                searchQuery,
                options,
                timestamp: new Date().toISOString()
            };

            console.log('[ProductSearchService searchProducts Started]:', logContext);

            const baseQuery = this._buildBaseQuery(searchQuery, category, brand);
            const priceQuery = this._buildPriceQuery(minPrice, maxPrice);
            const finalQuery = { ...baseQuery, ...priceQuery };
            console.log("final",finalQuery);
            // First, get total counts without pagination
            const [totalOriginalCount, totalResellCount] = await Promise.all([
                
                Product.countDocuments(finalQuery),
                includeResell ? ResellProduct.countDocuments(finalQuery) : 0
            ]);

            const totalCount = totalOriginalCount + (includeResell ? totalResellCount : 0);

            // Fetch products with pagination
            const [originalProducts, resellProducts] = await Promise.all([
                Product.find(finalQuery)
                    .populate('seller', 'name phone')
                    .skip(skip)
                    .limit(limitNum)
                    .sort({ [sortBy]: sortOrder }),

                includeResell ? ResellProduct.find(finalQuery)
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
                    .skip(skip)
                    .limit(limitNum)
                    .sort({ [sortBy]: sortOrder }) : []
            ]);

            // Filter out resell products with no original product and normalize all products
            const normalizedProducts = [
                ...originalProducts.map(p => this._normalizeProductResponse(p, false)),
                ...resellProducts
                    .filter(rp => rp.originalProduct)
                    .map(rp => this._normalizeProductResponse(rp.originalProduct, true, rp))
            ];

            // Sort combined products
            const sortedProducts = this._sortProducts(normalizedProducts, sortBy, sortOrder);

            console.log('[ProductSearchService searchProducts Success]:', {
                ...logContext,
                totalResults: normalizedProducts.length,
                originalCount: originalProducts.length,
                resellCount: resellProducts.length,
                totalCount
            });

            return {
                products: sortedProducts,
                pagination: {
                    total: totalCount,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(totalCount / limitNum)
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
        if (brand) {
            const brands = brand.split(',');
            query.brand = brands.length > 0 ? { $in: brands.map(b => new RegExp(b, 'i')) } : { $regex: brand, $options: 'i' };
        }
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
                const aPrice = Math.min(...(a.variants?.map(v => v.price) || [0]));
                const bPrice = Math.min(...(b.variants?.map(v => v.price) || [0]));
                return (aPrice - bPrice) * sortOrder;
            }

            if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
                return ((new Date(a[sortBy])) - (new Date(b[sortBy]))) * sortOrder;
            }

            return ((a[sortBy] || 0) - (b[sortBy] || 0)) * sortOrder;
        });
    }
}

module.exports = new ProductSearchService();