const mongoose = require('mongoose')


const userSchema = mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" }, // Cloudinary URL
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date },
    phoneNumber: {
        type: String,
    },
    bio:{
        type:String,
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{
        _id: false,
        recipientId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
  })

userSchema.index({ 'friendRequests.recipientId': 1 });

module.exports = mongoose.model("User", userSchema)

