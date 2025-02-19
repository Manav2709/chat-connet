const mongoose = require('mongoose')



const groupSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    avatar: { type: String, default: "" }, // Cloudinary URL
    createdAt: { type: Date, default: Date.now },
    // Optional: Link to a community (if groups belong to a community)
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community" },
  })


module.exports = mongoose.model("Group", groupSchema)