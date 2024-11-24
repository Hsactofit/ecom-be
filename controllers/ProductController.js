const ProductService = require('../services/product/ProductService');
const ResellProductService = require('../services/product/ResellProductService');
const ProductSearchService = require('../services/product/ProductSearchService');

class ProductController {
    async createProduct(req, res) {
        try {
            const productData = {
                ...req.body,
                seller: req.user.id // Assuming user ID is set by auth middleware
            };

            const product = await ProductService.createProduct(productData);

            res.status(201).json({
                success: true,
                product,
                message: 'Product created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateProduct(req, res) {
        try {
            const { productId } = req.params;
            const product = await ProductService.updateProduct(productId, req.body);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                product,
                message: 'Product updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { productId } = req.params;
            const product = await ProductService.deleteProduct(productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async acceptProduct(req, res) {
        try {
            const { productId } = req.params;
            const product = await ProductService.updateVerificationStatus(productId, true);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            return res.status(200).json({ message: 'Product accepted successfully', product });
        } catch (error) {
            return res.status(500).json({ message: 'Error accepting product', error: error.message });
        }
    }

    async rejectProduct(req, res) {
        try {
            const { productId } = req.params;
            const product = await ProductService.updateVerificationStatus(productId, false);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            return res.status(200).json({ message: 'Product rejected successfully', product });
        } catch (error) {
            return res.status(500).json({ message: 'Error rejecting product', error: error.message });
        }
    }

    async getAllProducts(req, res) {
        try {
            const products = await ProductService.getAllProducts();

            if (!products.length) {
                return res.status(404).json({ message: 'No products found' });
            }

            return res.status(200).json({ message: 'Products retrieved successfully', products });
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving products', error: error.message });
        }
    }
}

class ResellProductController {
    async createResellProduct(req, res) {
        try {
            const { originalProductId, title, variants } = req.body;
            const sellerId = req.user.id; // Assuming user ID is set by auth middleware

            const resellProduct = await ResellProductService.createResellProduct(
                originalProductId,
                sellerId,
                title,
                variants
            );

            res.status(201).json({
                success: true,
                product: resellProduct,
                message: 'Resell product created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateResellProduct(req, res) {
        try {
            const { resellProductId } = req.params;
            const sellerId = req.user.id;
            const updateData = req.body;

            const resellProduct = await ResellProductService.updateResellProduct(
                resellProductId,
                sellerId,
                updateData
            );

            if (!resellProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Resell product not found'
                });
            }

            res.json({
                success: true,
                product: resellProduct,
                message: 'Resell product updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteResellProduct(req, res) {
        try {
            const { resellProductId } = req.params;
            const sellerId = req.user.id;

            const resellProduct = await ResellProductService.deleteResellProduct(
                resellProductId,
                sellerId
            );

            if (!resellProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Resell product not found'
                });
            }

            res.json({
                success: true,
                message: 'Resell product deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

class ProductSearchController {
    async getProductById(req, res) {
        try {
            const { productId } = req.params;
            const product = await ProductSearchService.getProductById(productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            res.json({
                success: true,
                product
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async searchProducts(req, res) {
        try {
            const {
                query,
                page,
                limit,
                category,
                brand,
                minPrice,
                maxPrice,
                sortBy,
                sortOrder,
                includeResell
            } = req.query;

            const searchResults = await ProductSearchService.searchProducts(query, {
                page: parseInt(page),
                limit: parseInt(limit),
                category,
                brand,
                minPrice: parseFloat(minPrice),
                maxPrice: parseFloat(maxPrice),
                sortBy,
                sortOrder: parseInt(sortOrder),
                includeResell: includeResell === 'true'
            });

            res.json({
                success: true,
                ...searchResults
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = {
    productController: new ProductController(),
    resellProductController: new ResellProductController(),
    productSearchController: new ProductSearchController()
};