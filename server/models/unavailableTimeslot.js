const mongoose = require("mongoose");

const unavailableTimeslotSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    date: {
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
    startedAtDate: {
        type: Date,
        required: true
    },
    endedAtDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    }
});

unavailableTimeslotSchema.index({staffId: 1});

const UnavailableTimeslot = mongoose.model("UnavailableTimeslot", unavailableTimeslotSchema);

module.exports = UnavailableTimeslot;