const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    address: [
      {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        streetAddress: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    // cart: [
    //   {
    //     productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    //     quantity: { type: Number, default: 1 },
    //   },
    // ],
    // wishlist: [
    //   {
    //     productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    //   },
    // ],
    // orderHistory: [
    //   {
    //     orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    //     purchaseDate: { type: Date },
    //   },
    // ],
    paymentMethods: [
      {
        cardType: { type: String, required: true },
        cardNumber: { type: String, required: true },
        expiryDate: { type: String, required: true },
        cardHolderName: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    profilePictureUrl: {
      type: String,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpiration: {
      type: Date,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
