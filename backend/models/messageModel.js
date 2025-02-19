
const mongoose = require('mongoose')


const messageSchema = mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Use dynamic references for receiver (user/group/community)
    receiverType: { 
      type: String, 
      enum: ["user", "group", "community"], 
      required: true 
    },
    receiverId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      refPath: "receiverType" // Dynamically reference "User", "Group", or "Community"
    },
    text: { type: String, default: "" },
    image: { type: String, default: "" }, // Cloudinary URL
    video: { type: String, default: "" }, // Cloudinary URL
    timestamp: { type: Date, default: Date.now },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track read receipts
  })


module.exports = mongoose.model("Message", messageSchema)

