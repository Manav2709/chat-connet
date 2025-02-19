
const mongoose = require('mongoose')

const communitySchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }], // Subgroups in the community
    announcements: {
        type: Array,
        default: []
    },
    avatar: { type: String, default: "" }, // Cloudinary URL
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

  })

module.exports = mongoose.model("Community", communitySchema)