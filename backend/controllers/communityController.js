const asyncHandler = require("express-async-handler")
const Community = require("../models/communityModel")


// create a community
const createCommunity = asyncHandler(async (req,res) => {
    try {
        const community = await Community.create({
            name: req.body.name,
            description: req.body.description,
            admin: req.user.id,
            members: [req.user.id, ...req.body.members || ""],
            groups: [...req.body.groups || ""],
            announcements: [req.body.announcements || ""],
            avatar: req.body.avatar || ""
        })
        res.status(201).json(community)
    } catch (error) {
        res.status(400);
        throw new Error(error.message)
    }
})

// get all communities
const getAllCommunities = asyncHandler(async(req, res) => {
    try {
        const communities = await Community.find().populate("members").populate("groups").populate("announcements")

        res.status(200).json(communities)
    } catch (error) {
        res.status(400);
        throw new Error(error.message)
    }
})

// get a particular community
const getCommunity = asyncHandler(async(req, res) => {
    try {
        const community = await Community.findById(req.params.communityId).populate("members").populate("groups").populate("announcements")
        if (!community) {
            res.status(404);
            throw new Error("Community not found")
        }
        res.status(200).json(community)
    } catch (error) {
        res.status(400);
        throw new Error(error.message)
    }
})

// add groups to a community
const addGroupToCommunity = asyncHandler(async (req, res)=> {
    try {
        const updateCommunity = await Community.findByIdAndUpdate(req.params.communityId,
            {$addToSet: {groups : {$each: req.body.groups}}},
            {new: true}
        )
        if (!updateCommunity) {
            res.status(404);
            throw new Error("Community not found")
        }
        res.status(200).json(updateCommunity)
    } catch (error) {
        res.status(400);
        throw new Error(error.message)
    }
})

// Post announcements in the community
const postAnnouncement = asyncHandler(async (req, res) => {
    try {
        const { announcements } = req.body;

        if (!announcements || announcements.length === 0) {
            res.status(400);
            throw new Error("Announcements cannot be empty");
        }

        const updatedCommunity = await Community.findByIdAndUpdate(
            req.params.communityId,
            { $push: { announcements: Array.isArray(announcements) ? { $each: announcements } : announcements } },
            { new: true }
        );

        if (!updatedCommunity) {
            res.status(404);
            throw new Error("Community not found");
        }

        res.status(200).json({ message: "Announcement posted successfully", community: updatedCommunity });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// get groups in a community
const getCommunityGroups = asyncHandler(async(req, res) => {
    try {
        const community = await Community.findById(req.params.communityId).select("groups").populate("groups")
        const groups = community ? community.groups : []
        res.status(200).json(groups)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const kickOutGroup = asyncHandler(async (req, res) => {
    try {
        const updateCommunity = await Community.findByIdAndUpdate(req.params.communityId,
            {$pull: {groups: req.params.groupId}},
            {new: true}
            )
        if (!updateCommunity) {
            res.status(404);
            throw new Error("Community not found");
        }
        res.status(200).json({updateCommunity, message: "Group delete successfully"})
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

// delete a community
const deleteCommunity = asyncHandler (async(req, res) => {
    try {
        const removeCommunity = await Community.findByIdAndDelete(req.params.communityId)
        if (!removeCommunity) {
            res.status(404);
            throw new Error("Community not found");
        }
        res.status(200).json({message: "Community deleted successfully"})
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
    
})



module.exports = {createCommunity, getAllCommunities, getCommunity, addGroupToCommunity, getCommunityGroups, kickOutGroup, postAnnouncement, deleteCommunity}