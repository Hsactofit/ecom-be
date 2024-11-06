const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: Array,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    sizes: {
      type: Array,
      required: true,
    },
    color: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 3,
      required: false,
    },
    discount: {
      type: Number,
      required: false,
    },
    brand: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
