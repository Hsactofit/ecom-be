const NegotiatedProductService = require('../services/NegotiatedProductService');

class NegotiatedProductController {
    async createNegotiatedProduct(req, res) {
        try {
            const productData = {
                seller: req.body.seller,
                user: req.body.user,
                product: req.body.product,
                quantity: req.body.quantity,
                price: req.body.price,
                variantIndex: req.body.variantIndex
            };

            const negotiatedProduct = await NegotiatedProductService.createNegotiatedProduct(productData);

            res.status(201).json({
                success: true,
                negotiatedProduct,
                message: 'Negotiated product created successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getNegotiatedProduct(req, res) {
        try {
            const { id } = req.params;
            const negotiatedProduct = await NegotiatedProductService.getNegotiatedProduct(id);

            res.json({
                success: true,
                negotiatedProduct
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getNegotiatedProductsBySeller(req, res) {
        try {
            const { sellerId } = req.params;

            const negotiations = await NegotiatedProductService.getNegotiatedProductsBySeller(sellerId);

            res.json({
                success: true,
                negotiations,
                count: negotiations.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteNegotiatedProduct(req, res) {
        try {
            const { id } = req.params;

            // First get the negotiated product to check authorization
            const negotiatedProduct = await NegotiatedProductService.getNegotiatedProduct(id);

            await NegotiatedProductService.deleteNegotiatedProduct(id);

            res.json({
                success: true,
                message: 'Negotiated product deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

}

module.exports = new NegotiatedProductController();