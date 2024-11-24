const express = require('express');
const router = express.Router();
const {productController, resellProductController, productSearchController} = require('../controllers/ProductController');
const {authenticateToken, checkRole} = require('../middleware/auth');

// Protected routes for original products
router.post('/', authenticateToken, checkRole('seller'), productController.createProduct);
// router.get('/myListings', authenticateToken, checkRole('seller'), async (req, res) => {
//     req.query.seller = req.user.id;
//     return productSearchController.searchProducts(req, res);
// });
router.put('/:productId', authenticateToken, checkRole('seller'), productController.updateProduct);
router.delete('/:productId', authenticateToken, checkRole('seller'), productController.deleteProduct);

// Protected routes for resell products
router.post('/resell', authenticateToken, checkRole('reseller'), resellProductController.createResellProduct);
// router.get('/resell/my-listings', authenticateToken, checkRole('reseller'), async (req, res) => {
//     req.query.seller = req.user.id;
//     req.query.includeResell = true;
//     return productSearchController.searchProducts(req, res);
// });
router.put('/resell/:resellProductId', authenticateToken, checkRole('reseller'), resellProductController.updateResellProduct);
router.delete('/resell/:resellProductId', authenticateToken, checkRole('reseller'), resellProductController.deleteResellProduct);

// Public routes for product search
router.get('/search', productSearchController.searchProducts);
router.get('/:productId', productSearchController.getProductById);

// Accept product
router.patch('/:productId/accept', productController.acceptProduct);

// Reject product
router.patch('/:productId/reject', productController.rejectProduct);

// Get all products
router.get('/', productController.getAllProducts);

module.exports = router;