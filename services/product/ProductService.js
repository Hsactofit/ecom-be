const Product = require('../../models/Product');
const { logError } = require('../../utils/logError');

class ProductService {

    async createProduct(productData) {
        try {
            console.log(productData);
            if (!productData || !productData.product.title || !productData.seller || !productData.product.category) {
                throw new Error('Title, seller, and category are required');
            }
            console.log('[ProductService createProduct Started]:', {
                title: productData.product.title,
                seller: productData.seller,
                category: productData.product.category,
                timestamp: new Date().toISOString()
            });

            // Check if product already exists for this seller
            const existingProduct = await Product.findOne({
                seller: productData.seller,
                title: productData.product.title
            });

            if (existingProduct) {
                throw new Error('Product with this title already exists for this seller');
            }

            const product = new Product(productData.product);
            product.seller = productData.seller;
            await product.save();

            console.log('[ProductService createProduct Success]:', {
                productId: product._id,
                title: product.title,
                seller: product.seller,
                timestamp: new Date().toISOString()
            });

            return product;
        } catch (error) {
            logError('createProduct', error, {
                title: productData?.title,
                seller: productData?.seller,
                category: productData?.category,
                validationPassed: !!(productData?.title && productData?.seller && productData?.category)
            });
            throw error;
        }
    }

    async updateProduct(productId, updateData) {
        try {
            if (!productId || !updateData) {
                throw new Error('Product ID and update data are required');
            }

            console.log('[ProductService updateProduct Started]:', {
                productId,
                updateFields: Object.keys(updateData),
                timestamp: new Date().toISOString()
            });

            const product = await Product.findById(productId);
            if (!product) {
                throw new Error('Product not found');
            }

            // Check if title is being updated and ensure it won't create a duplicate
            if (updateData.title && updateData.title !== product.title) {
                const existingProduct = await Product.findOne({
                    seller: product.seller,
                    title: updateData.title,
                    _id: { $ne: productId }
                });

                if (existingProduct) {
                    throw new Error('Product with this title already exists for this seller');
                }
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                productId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            console.log('[ProductService updateProduct Success]:', {
                productId,
                updatedFields: Object.keys(updateData),
                timestamp: new Date().toISOString()
            });

            return updatedProduct;
        } catch (error) {
            logError('updateProduct', error, {
                productId,
                updateFields: Object.keys(updateData || {})
            });
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            if (!productId) {
                throw new Error('Product ID is required');
            }

            console.log('[ProductService deleteProduct Started]:', {
                productId,
                timestamp: new Date().toISOString()
            });

            const product = await Product.findByIdAndUpdate(
                productId,
                { $set: { status: 'deleted' } },
                { new: true }
            );

            if (!product) {
                throw new Error('Product not found');
            }

            console.log('[ProductService deleteProduct Success]:', {
                productId,
                timestamp: new Date().toISOString()
            });

            return product;
        } catch (error) {
            logError('deleteProduct', error, { productId });
            throw error;
        }
    }
    
    async updateVerificationStatus(productId, isVerified) {
        try {
            const product = await Product.findByIdAndUpdate(
                productId,
                { 
                    isVerified, 
                    status: isVerified ? 'active' : 'abandoned' 
                },
                { new: true }
            );
    
            return product;
        } catch (error) {
            throw new Error(error.message);
        }
    };

    async getAllProducts() {
        try {
            // Fetch all products
            const products = await Product.find()
                .populate('seller', 'name email') // Populate seller details (name and email)
                .select('-__v'); // Exclude the `__v` field from the response
            return products;
        } catch (error) {
            throw new Error(error.message);
        }
    };
    async getActiveSellerProducts(sellerId) {
        try {
            const products = await Product.find({
                seller: sellerId,
                status: 'active'
            });
            return products;
        } catch (error) {
            throw new Error('Error getting active seller products');
        }
    };

    async getSellerIdFromProductId(productId) {
        try {

        // Find the product by its _id and select only the seller field
        const product = await Product.findById(productId).select('seller');

        if (!product) {
            throw new Error('Product not found');
        }

        // Return the sellerId
        return product.seller;
        } catch (error) {
            throw new Error('Error getting active seller products');
        }
    };

    async getSellerProductsStockLevels(sellerId) {
        try {
            const products = await Product.find({ seller: sellerId, status: 'active' });
            
            const stockLevels = products.map((product) => ({
                productId: product._id,
                title: product.title,
                variants: product.variants.map((variant) => ({
                    variantId: variant._id,
                    stock: variant.stock,
                })),
            }));
            
            return stockLevels;
        } catch (error) {
            throw new Error('Error fetching stock levels');
        }
    };

    async updateProductStock(sellerId, productId, variantIndex, stock) {
        try {
            const product = await Product.findOne({ _id: productId, seller: sellerId });
            
            if (!product) {
                return null; // Product not found or unauthorized
            }
            
            if (variantIndex < 0 || variantIndex >= product.variants.length) {
                return null; // Invalid variant index
            }
            
            product.variants[variantIndex].stock = stock;
            
            const updatedProduct = await product.save();
            
            return updatedProduct;
        } catch (error) {
            console.log(error);
            throw new Error('Error updating product stock');
        }
    };

}

module.exports = new ProductService();