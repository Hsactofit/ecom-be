const auth_route = require('./auth');
const user_route = require('./user.js');
const product_route = require('./product');
const cartRoute = require('./cart.js');
const order_route = require('./order');
const wishlistRoute = require('./wishlist.js');

module.exports = {
    auth_route,
    user_route,
    product_route,
    cartRoute,
    order_route,
    wishlistRoute
};