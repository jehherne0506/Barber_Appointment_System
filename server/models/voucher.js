const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    pointsRequired: {
        type: Number,
        required: true,
        min: 0
    },
    applicableService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    limitCount: {
        type: Number,
        min: 1
    },
    expiredAt: {
        type: Date,
    },
    discountType: {
        type: String,
        enum: ["PERCENTAGE", "FIXED"],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    }
});

const Voucher = mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;