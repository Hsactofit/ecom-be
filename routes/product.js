const express = require('express');
const router = express.Router();

const { ProductController } = require('../controllers');
const { isAdminVerifier } = require('../middlewares/verifyToken');

router.get('/', ProductController.get_products);
router.get('/bigdiscountproducts', ProductController.get_big_discount_products);
router.get('/newarrivalproducts', ProductController.get_new_arrivals_products);
router.get('/:id', ProductController.get_product);
// router.get('/name/:name', ProductController.getProductByName);
router.get('/:id/get_related_products', ProductController.getRelatedProducts);
router.post('/', isAdminVerifier, ProductController.create_product);
router.put('/:id', isAdminVerifier, ProductController.update_product);
router.delete('/:id', isAdminVerifier, ProductController.delete_user);


module.exports = router;