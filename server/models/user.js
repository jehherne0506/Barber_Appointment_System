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
    tempEmail: {
        type: String
    },
    emailChangeToken: {
        type: String
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
    styleProfile: {
        hairType: {
            type: String,
            enum: ["Straight", "Wavy", "Curly", "Coily", "Bald"],
            default: null
        },
        barberNotes: {
            type: String,
            default: null
        }
    }}, {timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true}});

userSchema.virtual('appointments', {
    ref: "Appointment",
    localField: "_id",
    foreignField: "customerId",
});

const User = mongoose.model("User", userSchema);

module.exports = User;