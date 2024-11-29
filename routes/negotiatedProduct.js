const express = require('express');
const router = express.Router();
const negotiatedProductController = require('../controllers/NegotiatedProductController');

router.post('/', negotiatedProductController.createNegotiatedProduct);

router.get('/seller/:sellerId', negotiatedProductController.getNegotiatedProductsBySeller);

router.get('/:id', negotiatedProductController.getNegotiatedProduct);

router.delete('/:id', negotiatedProductController.deleteNegotiatedProduct);

module.exports = router;