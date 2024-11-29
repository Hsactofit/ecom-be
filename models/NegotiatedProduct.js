const mongoose = require("mongoose");

const NegotiatedProductSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        variantIndex: {
            type: Number,
            required: true,
        },
        // isApproved: {
        //     type: Boolean,
        //     default: false
        // }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("NegotiatedProduct", NegotiatedProductSchema);