const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Voucher",
    },
    finalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true
    },
    startedAtDate: {
        type: Date,
        required: true
    },
    endedAtDate: {
        type: Date, 
        required: true
    },
    startedAt: {
        type: String,
        required: true
    },
    endedAt: {
        type: String,
        required: true
    },
    queueMin: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["UNPAID", "PAID", "REFUNDED"]
    },
    status: {
        type: String,
        default: "SCHEDULED",
        enum: ["SCHEDULED", "IN PROGRESS", "COMPLETED"]
    },
    smsNotified: {
        type: Boolean,
        default: false
    }}, {timestamps: true});

appointmentSchema.index({customerId: 1});
appointmentSchema.index({staffId: 1, date: 1});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;