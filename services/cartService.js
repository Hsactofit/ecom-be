const Cart = require("../models/Cart");
const User = require("../models/User");
const { logError } = require('../utils/logError');
const ProductSearchService = require("./product/ProductSearchService");

const cartService = {
    async getUserCart(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
            const cart = await Cart.findOne({ userId, status: 'active' })
                .lean();

            if (!cart) {
                return [];
            }

            const productsWithDetails = await Promise.all(
                cart.items.map(async (item) => {
                    try {
                        const product = await ProductSearchService.getProductById(item.productId);
                        let variantPrice = 0;

                        if (product && typeof item.variantIndex === 'number') {
                            const variant = product.variants[item.variantIndex];
                            if (variant) {
                                variantPrice = variant.price;
                                // Check if quantity meets minimum requirement for special price
                                if (item.quantity >= variant.minQuantity && variant.minPrice) {
                                    variantPrice = variant.minPrice;
                                }
                            }
                        }

                        // Use productPrice if set, otherwise use variant price
                        const finalPrice = item.productPrice || variantPrice;

                        return {
                            ...item,
                            productDetails: product,
                            variant: product?.variants[item.variantIndex],
                            pricePerUnit: finalPrice,
                            totalPrice: item.quantity * finalPrice
                        };
                    } catch (error) {
                        console.log(`Failed to fetch product details for productId: ${item.productId}`, error);
                        return {
                            ...item,
                            productDetails: null,
                            error: 'Product details unavailable'
                        };
                    }
                })
            );

            const cartTotal = productsWithDetails.reduce((total, item) => {
                return total + (item.totalPrice || 0);
            }, 0);

            return {
                ...cart,
                items: productsWithDetails,
                cartTotal
            };
        } catch (error) {
            logError('getUserCart', error, { userId });
            throw error;
        }
    },

    async addItem(userId, productId, variantIndex, quantity, productPrice = 0) {
        try {
            if (!userId || !productId || typeof variantIndex !== 'number' || typeof quantity !== 'number') {
                throw new Error('Invalid input for adding item');
            }

            const product = await ProductSearchService.getProductById(productId);
            if (!product) {
                throw new Error('Product not Found!');
            }

            // Validate variant exists
            if (!product.variants[variantIndex]) {
                throw new Error('Invalid variant selected');
            }

            const variant = product.variants[variantIndex];

            // Check stock
            if (quantity > variant.stock) {
                throw new Error(`Cannot add quantity. Only ${variant.stock} units available in stock!`);
            }

            const cart = await Cart.findOne({ userId, status: 'active' });

            if (cart) {
                // Check if same product with same variant exists
                const existingItemIndex = cart.items.findIndex(item =>
                    item.productId.toString() === productId &&
                    item.variantIndex === variantIndex
                );

                if (existingItemIndex !== -1) {
                    // Update existing item
                    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                    if (newQuantity > variant.stock) {
                        throw new Error(`Cannot update quantity. Only ${variant.stock} units available in stock!`);
                    }
                    cart.items[existingItemIndex].quantity = newQuantity;
                    if (productPrice) {
                        cart.items[existingItemIndex].productPrice = productPrice;
                    }
                } else {
                    // Add as new item
                    cart.items.push({
                        productId,
                        variantIndex,
                        quantity,
                        productPrice
                    });
                }

                const updatedCart = await cart.save();
                await this.updateUserCart(userId, productId, variantIndex, quantity, productPrice);
                return updatedCart;
            } else {
                // Create new cart
                const newCart = new Cart({
                    userId,
                    status: 'active',
                    items: [{
                        productId,
                        variantIndex,
                        quantity,
                        productPrice
                    }]
                });
                const savedCart = await newCart.save();
                await this.updateUserCart(userId, productId, variantIndex, quantity, productPrice);
                return savedCart;
            }
        } catch (error) {
            logError('addItem', error, { userId, productId, variantIndex, quantity });
            throw error;
        }
    },

    async updateItem(userId, productId, variantIndex, quantity, productPrice) {
        try {
            if (!userId || !productId || typeof variantIndex !== 'number' || typeof quantity !== 'number') {
                throw new Error('Invalid input for updating item');
            }

            if (quantity <= 0) {
                return this.removeItem(userId, productId, variantIndex);
            }

            const product = await ProductSearchService.getProductById(productId);
            if (!product) {
                throw new Error('Product not Found!');
            }

            if (!product.variants[variantIndex]) {
                throw new Error('Invalid variant selected');
            }

            const variant = product.variants[variantIndex];
            if (quantity > variant.stock) {
                throw new Error(`Cannot update quantity. Only ${variant.stock} units available in stock!`);
            }

            const updatedCart = await Cart.findOneAndUpdate(
                {
                    userId,
                    status: 'active',
                    'items.productId': productId,
                    'items.variantIndex': variantIndex
                },
                {
                    $set: {
                        'items.$.quantity': quantity,
                        'items.$.productPrice': productPrice
                    }
                },
                { new: true }
            );

            if (!updatedCart) {
                throw new Error('Item not found in cart');
            }

            await this.updateUserCart(userId, productId, variantIndex, quantity, productPrice);
            return updatedCart;
        } catch (error) {
            logError('updateItem', error, { userId, productId, variantIndex, quantity });
            throw error;
        }
    },

    async removeItem(userId, productId, variantIndex) {
        try {
            if (!userId || !productId || typeof variantIndex !== 'number') {
                throw new Error('Invalid input for removing item');
            }
            const updatedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active' },
                {
                    $pull: {
                        items: {
                            productId,
                            variantIndex
                        }
                    }
                },
                { new: true }
            );
            await this.updateUserCart(userId, productId, variantIndex, 0, 0);
            return updatedCart;
        } catch (error) {
            logError('removeItem', error, { userId, productId, variantIndex });
            throw error;
        }
    },

    async checkItemInCart(userId, productId, variantIndex) {
        try {
            if (!userId || !productId || typeof variantIndex !== 'number') {
                throw new Error('Invalid input for checking item');
            }
            const cart = await Cart.findOne({
                userId,
                status: 'active',
                'items.productId': productId,
                'items.variantIndex': variantIndex
            });
            const inCart = !!cart;
            const quantity = cart?.items.find(item =>
                item.productId.toString() === productId &&
                item.variantIndex === variantIndex
            )?.quantity || 0;
            return { inCart, quantity };
        } catch (error) {
            logError('checkItemInCart', error, { userId, productId, variantIndex });
            throw error;
        }
    },

    async getCartItems(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
            const cartItems = await Cart.findOne(
                { userId, status: 'active' },
                { 'items.productId': 1, 'items.variantIndex': 1, 'items.quantity': 1, 'items.productPrice': 1 }
            ).lean();
            return cartItems;
        } catch (error) {
            logError('getCartItems', error, { userId });
            throw error;
        }
    },

    async clearCart(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }

            // Clear the cart in the Cart collection
            const clearedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active' },
                { $set: { items: [] } },
                { new: true }
            );

            // Clear the user's cart in the User schema
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            user.cart = []; // Clear the user's cart array
            await user.save();

            return {
                message: 'Cart cleared successfully',
                clearedCart
            };
        } catch (error) {
            logError('clearCart', error, { userId });
            throw error;
        }
    },

    async markCartAsCompleted(userId) {
        try {
            if (!userId) {
                throw new Error('Invalid userId');
            }
            const completedCart = await Cart.findOneAndUpdate(
                { userId, status: 'active' },
                { status: 'completed' },
                { new: true }
            );
            return completedCart;
        } catch (error) {
            logError('markCartAsCompleted', error, { userId });
            throw error;
        }
    },

    async updateUserCart(userId, productId, variantIndex, quantity = 1, productPrice = 0) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const existingCartItem = user.cart.find(item =>
                item.productId.toString() === productId &&
                item.variantIndex === variantIndex
            );

            if (existingCartItem) {
                if (quantity <= 0) {
                    user.cart = user.cart.filter(item =>
                        !(item.productId.toString() === productId &&
                            item.variantIndex === variantIndex)
                    );
                } else {
                    existingCartItem.quantity = quantity;
                    existingCartItem.productPrice = productPrice;
                }
            } else if (quantity > 0) {
                user.cart.push({ productId, variantIndex, quantity, productPrice });
            }

            await user.save();
            return user;
        } catch (error) {
            logError('updateUserCart', error, { userId, productId, variantIndex, quantity, productPrice });
            throw error;
        }
    }
};

module.exports = cartService;