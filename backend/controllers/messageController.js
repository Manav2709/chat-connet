const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");

// Post a new message
const postMessage = asyncHandler(async (req, res) => {
    try {
        const { text, image, video } = req.body;
        const { receiverType, receiverId } = req.params;

        const newMessage = await Message.create({
            text,
            image,
            video,
            senderId: req.user.id,
            receiverType,
            receiverId,
            timestamp: new Date(),
        });

    } catch (error) {
        res.status(500).json({ message: "Error posting message", error: error.message });
    }
});

// Fetch conversation between two users
const userConversation = asyncHandler(async (req, res) => {
    try {
        const { receiverId } = req.params;
        const currentUserId = req.user.id;

        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId, receiverType: "user" },
                { senderId: receiverId, receiverId: currentUserId, receiverType: "user" },
            ],
        }).sort({ timestamp: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching conversation", error: error.message });
    }
});

// Fetch group conversation
const groupConversation = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;

        const messages = await Message.find({
            receiverId: groupId,
            receiverType: "group",
        }).sort({ timestamp: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching group messages", error: error.message });
    }
});

// Fetch community conversation (for announcements)
const communityConversation = asyncHandler(async (req, res) => {
    try {
        const { communityId } = req.params;

        const messages = await Message.find({
            receiverId: communityId,
            receiverType: "community",
        }).sort({ timestamp: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching community messages", error: error.message });
    }
});

module.exports = {
    postMessage,
    userConversation,
    groupConversation,
    communityConversation,
};