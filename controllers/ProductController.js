const Product = require('../models/Product');
const relatedProducts=require("../services/product.services");

const ProductController = {
    
    /* get all products */
   async get_products(req, res) {
    const qCategory = req.query.category;
    const keyword = req.query.keyword === undefined ? "" : req.query.keyword;


    // Get page and limit from query or set default values
    const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10;  // Default to 10 products per page if not provided
    
    try {
        let products;
        const query = {};  // Empty query object to build dynamically
        // Get the total number of products for pagination calculation
        let totalProducts = await Product.countDocuments(query);
        // If qCategory is undefined, sort by creation date
        if (qCategory==undefined) {
            products = await Product.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)  // Skip products from previous pages
                .limit(limit);  // Limit the number of products to `limit`
        }
        // If qCategory is present, filter by category
        else if (qCategory) {
            console.log("qCategory");
            products = await Product.find({
                category: qCategory,
                title: { $regex: keyword, $options: 'i' }// Simple string match
            })
            .skip((page - 1) * limit)
            .limit(limit);
            totalProducts = await Product.countDocuments(
                qCategory ? { category: qCategory, title: { $regex: keyword, $options: 'i' }} : {}
            );
        }

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            type: "success",
            currentPage: page,  // Current page number
            totalPages: totalPages,  // Total number of pages
            totalProducts: totalProducts,  // Total number of products in the collection
            productsPerPage: limit,  // Products per page (limit)
            products: products  // The actual products returned
        });
    } catch (err) {
        res.status(500).json({
            type: "error",
            message: "Something went wrong please try again",
            err
        });
    }
    },

    /* get related products */
    async getRelatedProducts(req, res) {

        const id = req.params.id;  
        try {

            let product;

            if(id) {
                product = await Product.findById(id);
                console.log(product);
                let related_products=await relatedProducts(product);
                res.status(200).json({
                    type: "success",
                    related_products
                })
            }
            
        } catch (err) {
            res.status(500).json({
                type: "error",
                message: "Something went wrong please try again",
                err
            })
        }
    },

    /* get single product */
    async get_product(req, res) {
        try {
            console.log("This endpoint is hit here");
            const product = await Product.findById(req.params.id);
            if(!product) {
                res.status(404).json({
                    type: "error",
                    message: "Product doesn't exists"
                })
            } else{
                res.status(200).json({
                    type: "success",
                    product
                })
            }   
        } catch (err) {
            res.status(500).json({
                type: "error",
                message: "Something went wrong please try again",
                err
            })
        }
    },

    /* create new product */
    async create_product(req, res) {
        const newProduct = new Product(req.body);
        try {
            const savedProduct = await newProduct.save();
            res.status(201).json({
                type: "success",
                message: "Product created successfully",
                savedProduct
            })
        } catch (err) {
            res.status(500).json({
                type: "error",
                message: "Something went wrong please try again",
                err
            })
        }
    },

    /* update product */
    async update_product(req, res) {
        const existing = await Product.findById(req.params.id);
        if(!existing){
            res.status(404).json({
                type: "error",
                message: "Product doesn't exists"
            })
        } else {
            try {
                const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {
                    $set: req.body
                },
                    { new: true }
                );
                res.status(200).json({
                    type: "success",
                    message: "Product updated successfully",
                    updatedProduct
                })
            } catch (err) {
                res.status(500).json({
                    type: "error",
                    message: "Something went wrong please try again",
                    err
                })
            }
        }
    },

    /* delete product */
    async delete_user(req, res) {
        const existing = await Product.findById(req.params.id);
        if (!existing) {
            res.status(200).json({
                type: "error",
                message: "Product doesn't exists"
            })
        } else {
            try {
                await Product.findOneAndDelete(req.params.id);
                res.status(200).json({
                    type: "success",
                    message: "Product has been deleted successfully"
                });
            } catch (err) {
                res.status(500).json({
                    type: "error",
                    message: "Something went wrong please try again",
                    err
                })
            }
        }
    },

    async get_big_discount_products(req, res) {
        console.log("bigdiscount api");
        try {
            // Fetch products sorted by discount in descending order
            const products = await Product.find({ discount: { $exists: true } })
            .sort({ discount: -1 })  // Sort by discount in descending order
            .limit(3);  // Optionally limit the number of results (remove this if not needed)
    
            res.status(200).json({
                type: "success",
                products: products  // The actual products returned
            });
        } catch (err) {
            res.status(500).json({
                type: "error",
                message: "Something went wrong please try again",
                err
            });
        }
    },

    async get_new_arrivals_products(req, res) {
        console.log("newarrival endpoint");
        try {
            // Fetch products sorted by creation date in descending order (latest first)
            const products = await Product.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(3);  // Optionally limit the number of results (remove this if not needed)

            res.status(200).json({
                type: "success",
                products: products  // The actual products returned
            });
        } catch (err) {
            res.status(500).json({
                type: "error",
                message: "Something went wrong please try again",
                err
            });
        }
    }

    // async getProductByName(req, res) {
    //     const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
    //     const limit = parseInt(req.query.limit) || 10;  // Default to 10 products per page if not provided
    //
    //     const qCategory = req.query.category;
    //
    //     const productName = req.params.name; // Get the product name from the request parameters
    //
    //     try {
    //
    //         products = await Product.find({
    //             category: qCategory,
    //             title: { $regex: productName, $options: 'i' }// Simple string match
    //         })
    //             .skip((page - 1) * limit)
    //             .limit(limit);
    //         totalProducts = await Product.countDocuments(
    //             qCategory ? { category: qCategory } : {}
    //         );
    //         // const products = await Product.find({ title: { $regex: productName, $options: 'i' } });
    //         console.log("product", products)
    //         if (products.length > 0) {
    //             res.status(200).json({
    //                 type: "success",
    //                 message: "Products retrieved successfully",
    //                 data: products
    //             });
    //         } else {
    //             res.status(200).json({
    //                 type: "error",
    //                 message: "No products found with the given name",
    //                 data: []
    //             });
    //         }
    //     } catch (err) {
    //         res.status(500).json({
    //             type: "error",
    //             message: "Something went wrong, please try again",
    //             err
    //         });
    //     }
    // }

};

module.exports = ProductController;