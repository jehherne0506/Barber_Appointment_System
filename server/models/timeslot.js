const mongoose = require("mongoose");

const timeslotSchema = new mongoose.Schema({
    startedAt: {
        type: Date,
        required: true
    },
    endedAt: {
        type: Date,
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        default: "AVAILABLE",
        enum: ["AVAILABLE", "BOOKED"]
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment"
    }}, {timestamps: true});

timeslotSchema.index(
    {staffId: 1, startedAt: 1},
    {unique: true}
)

const Timeslot = mongoose.model("Timeslot", timeslotSchema);

module.exports = {Timeslot};