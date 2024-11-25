const mongoose = require("mongoose");

const ResellVariantSchema = new mongoose.Schema({
    memorySize: {
        size: Number,
        unit: {
            type: String,
            enum: ['MB', 'GB', 'TB']
        }
    },
    price: {
        type: Number,
        min: 0,
    },
    stock: {
        type: Number,
        min: 0,
    },
    discount: {
        percentage: Number,
        validUntil: Date
    }
},  {_id: false});

const ResellProductSchema = new mongoose.Schema(
    {
        originalProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: String,
        variants: [ResellVariantSchema],
        status: {
            type: String,
            enum: ['active', 'inactive', 'deleted'],
            default: 'active'
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// Compound index for seller and original product uniqueness
ResellProductSchema.index({ seller: 1, originalProduct: 1 }, { unique: true });

// Compound index for seller and title uniqueness
ResellProductSchema.index({ seller: 1, title: 1 }, { unique: true });

// Simple slug generator
ResellProductSchema.pre("save", function(next) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    next();
});

module.exports = mongoose.model("ResellProduct", ResellProductSchema);