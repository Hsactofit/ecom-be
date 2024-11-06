const Product = require('../models/Product');

const getRelatedProducts = async (currentProduct) => {
    try {
        // Step 1: Define a price range (e.g., 30% +/- of current product's price)
        const priceRange = {
            $gte: currentProduct.price * 0.7,  // 70% of the current price
            $lte: currentProduct.price * 1.3   // 130% of the current price
        };

        console.log("Price range calculated:", priceRange);

        // Step 2: Try to find products matching category, brand, and within the price range
        let relatedProducts = await Product.find({
            _id: { $ne: currentProduct._id },  // Exclude the current product
            category: currentProduct.category, // Match same category
            brand: currentProduct.brand,       // Match same brand
            price: priceRange                  // Match price range
        }).sort({ priceDifference: 1 }).limit(5);

        console.log("Products with same category, brand, and within price range:", relatedProducts);

        // Step 3: If fewer than 5 products are found, relax brand filter
        if (relatedProducts.length < 5) {
            const additionalProducts = await Product.find({
                _id: { $ne: currentProduct._id },   // Exclude current product
                category: currentProduct.category,  // Same category
                price: priceRange                   // Same price range
            }).limit(5 - relatedProducts.length);      // Limit to fill up remaining products

            // Combine the two results
            relatedProducts = [...relatedProducts, ...additionalProducts];
            console.log("After relaxing brand filter (same category, price range):", additionalProducts);
        }

        // Step 4: If still fewer than 5, relax the price filter (only match category)
        if (relatedProducts.length < 5) {
            const fallbackProducts = await Product.find({
                _id: { $ne: currentProduct._id },   // Exclude current product
                category: currentProduct.category   // Same category, ignore price range
            }).limit(5 - relatedProducts.length);      // Limit to fill up remaining products

            // Combine with existing results
            relatedProducts = [...relatedProducts, ...fallbackProducts];
            console.log("After relaxing price filter (same category only):", fallbackProducts);
        }

        // Step 5: Return the final list of related products
        console.log("Final related products list:", relatedProducts);
        return relatedProducts;
    } catch (error) {
        console.error("Error fetching related products:", error);
        return [];
    }
};
    
module.exports = getRelatedProducts;
