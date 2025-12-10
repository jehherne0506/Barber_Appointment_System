const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minLength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minLength: 8
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true
    },
    phoneNumber: {
        type: String,
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        default: "CUSTOMER",
        enum: ["CUSTOMER", "STAFF", "ADMIN"]
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
    }]}, {timestamps: true});

const User = mongoose.model("User", userSchema);

module.exports = User;