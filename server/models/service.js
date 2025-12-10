const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    durationMin: {
        type: Number,
        min: 0
    },
    durationBlock: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        min: 0
    },
    staff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
    }]}, {timestamps: true});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;