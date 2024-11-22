const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
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
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        emailVerificationToken: String,
        emailVerificationExpires: Date,
        phoneVerified: {
            type: Boolean,
            default: false
        },
        phoneVerificationCode: String,
        phoneVerificationExpires: Date,
        address: [{
            fullName: String,
            phone: String,
            streetAddress: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
            isDefault: { type: Boolean, default: false },
        }],
        isVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ["customer", "seller", "admin", "reseller"],
            default: "customer",
        },
        paymentMethods: [{
            cardType: String,
            cardNumber: String,
            expiryDate: String,
            cardHolderName: String,
            isDefault: { type: Boolean, default: false },
        }],
        profilePictureUrl: String,
        darkMode: { type: Boolean, default: false },
        lastLogin: Date,
        resetToken: String,
        resetTokenExpiration: Date,
        status:{
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING",
        },
        businessProfile: {
            type: {
                storeName: String,
                description: String,
                location: String,
                rating: {
                    average: { type: Number, default: 0 },
                    count: { type: Number, default: 0 }
                },
                bankDetails: {
                    accountHolder: String,
                    accountNumber: String,
                    bankName: String,
                    ifscCode: String
                },
                earnings: {
                    total: { type: Number, default: 0 },
                    pending: { type: Number, default: 0 }
                }
            },
            default: null
        },
        cart: [
            {
              productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
              quantity: { type: Number, default: 1 },
            },
          ],
        wishlist: [
            {
              productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            },
        ]
    },
    { timestamps: true }
);

// Middleware to handle role change to seller/reseller
userSchema.pre('save', function(next) {
    if (this.isModified('role') && (this.role === 'seller' || this.role === 'reseller') && !this.businessProfile) {
        this.businessProfile = {
            storeName: '',
            description: '',
            location: '',
            rating: { average: 0, count: 0 },
            bankDetails: {},
            earnings: { total: 0, pending: 0 }
        };
    }

    // Update isVerified based on email and phone verification
    this.isVerified = this.emailVerified && this.phoneVerified;

    next();
});

module.exports = mongoose.model("User", userSchema);