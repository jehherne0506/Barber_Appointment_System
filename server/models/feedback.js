const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    comment: {
        type: String,
        required: true
    }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
