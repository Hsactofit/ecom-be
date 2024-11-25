const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema({
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
}, {_id: false});

const ProductSchema = new mongoose.Schema(
    {
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: String,
        description: String,
        images: [{
            type: String,
            alt: String,
        }, {_id: false}],
        isVerified: {
            type:Boolean,
            default:false
        },
        category: {
            type: String,
            enum: ['GPU', 'RAM', 'SSD', 'HDD', 'CPU', 'Motherboard', 'MiningRig', 'ASIC'],
        },
        specifications: {
            memoryType: {
                type: String,
                enum: ['DDR3', 'DDR4', 'DDR5', 'GDDR5', 'GDDR6', 'GDDR6X', 'HBM2'],
            },
            clockSpeed: {
                speed: Number,
                unit: {
                    type: String,
                    enum: ['MHz', 'GHz', 'TH/s', 'MH/s', 'GH/s'],
                }
            },
            interface: String,
            hashRate: {
                rate: Number,
                unit: {
                    type: String,
                    enum: ['MH/s', 'GH/s', 'TH/s'],
                }
            },
            powerConsumption: {
                watts: Number,
                efficiency: Number,
            },
            algorithm: [{
                type: String,
                enum: ['SHA-256', 'Ethash', 'Scrypt', 'X11', 'Equihash']
            }],
            supportedCoins: [String]
        },
        variants: [VariantSchema],
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            reviews: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Review"
            }]
        },
        brand: {
            type: String,
            enum: ['NVIDIA', 'AMD', 'Intel', 'Corsair', 'G.Skill', 'ASUS', 'MSI', 'Gigabyte', 'Bitmain', 'Canaan', 'MicroBT'],
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'deleted'],
            default: 'inactive'
        },
        warranty: {
            months: Number,
            description: String
        },
        quantity:{
            type:Number,
            required: true,
            default:1
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
);

// Compound index for seller and title uniqueness
ProductSchema.index({ seller: 1, title: 1 }, { unique: true });

// Simple slug generator
ProductSchema.pre("save", function(next) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    next();
});

module.exports = mongoose.model("Product", ProductSchema);