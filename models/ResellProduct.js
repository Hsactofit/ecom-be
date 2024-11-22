const mongoose = require("mongoose");
const {Schema} = require("mongoose");

const ResellProductSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    price: {
        type: Number,
        required: true
    },
    contacts: {
      type: String,
      required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("resellProduct", ResellProductSchema);
