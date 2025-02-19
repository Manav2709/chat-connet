const asyncHandler = require("express-async-handler")

const Group = require("../models/groupModel")

// create a group
const createGroup = asyncHandler( async (req, res) => {
    try {
        const newGroup = await Group.create({
            name: req.body.name,
            description: req.body.description,
            admin: req.user.id,
            members:[req.user.id, ...req.body.members || ""],
            avatar: req.body.avatar || "",
        })

        res.status(201).json({newGroup, message: "Group created successfully" })
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})


//get all groups
const getGroups = asyncHandler( async (req, res) => {
    try {
        const groups = await Group.find().populate("members")
        res.status(200).json(groups)
    } catch (error) {
        res.status(400)
        throw new Error("Error fetching groups")
    }
})

// get a patricular group by id
const findGroup = asyncHandler(async (req, res) => {
    try {
        const findGroup = await Group.findById(req.params.groupId)
        if (!findGroup) {
            res.status(404)
            throw new Error("Group not found")
        }
        res.status(200).json(findGroup)
    } catch (error) {
        res.status(400)
        throw new Error("Error fetching group")
    }
})

// add members to the group
const addMembersToGroup = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const { members } = req.body;

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { $addToSet: { members: { $each: members } } }, // Add new members without duplicates
            { new: true }
        );
        
        if(!updatedGroup) {
            res.status(404)
            throw new Error("Group not found")
        }

        res.status(200).json(updatedGroup);
    } catch (error) {
        res.status(400)
        throw new Error("Error adding members to group")
    }
})


// get members of a particular group
const getMembersOfParticularGroup = asyncHandler (async (req, res) => {
    try{
    const group = await Group.findById(req.params.groupId).select("members").populate("members");
    const members = group ? group.members : [];
    res.json(members); // Return the members of the group
    } catch(error) {
        res.status(400)
        throw new Error("Error fetching members of group")
    }
})

// delete group from the community
const deleteGroup = asyncHandler(async (req, res) => {
    try{
    const removeGroup = await Group.findByIdAndDelete(req.params.groupId)
    res.json({removeGroup, message: "Deleted Item"})
    if(!removeGroup) {
        res.status(404)
        throw new Error("Group not found")
    }
    } catch(error) {
        res.status(400)
        throw new Error("Error deleting group")
    }
})

module.exports = {createGroup, getGroups, findGroup, addMembersToGroup, getMembersOfParticularGroup, deleteGroup}