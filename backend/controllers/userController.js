const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const asyncHandler = require("express-async-handler")
const mongoose = require("mongoose")

// const nodemailer = require("nodemailer")
// const otpGenerator = require('otp-generator')



// let otp;


const registerUser = asyncHandler (async (req, res) => {
    
    console.log(req.body)
    const {username, email, password} = req.body;
    const existingUser = await User.findOne({email})
    const takenUsername = await User.findOne({username})
    if (takenUsername) {
        res.status(400)
        throw new Error("Username already taken")
    }
    if(existingUser){
        res.status(400)
        throw new Error("User already exists")
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
        username,
        email,
        password: hashedPassword
    })
    // otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    // const subject = "OTP Verification."
    // const text = `Hi ${username}! .Here's your OTP: ${otp}. Do not share it with anyone 🙅🏼‍♂️.`
    // const from = "user-330a7871-5fbc-4ded-948e-1b2d562b6c63@mailslurp.biz"
    // const to = "user-330a7871-5fbc-4ded-948e-1b2d562b6c63@mailslurp.biz"
    // const transport = nodemailer.createTransport({
    //     host: "mailslurp.mx",
    //     port: "2465",
    //     secure: true,
    //     auth: {
    //         user: "dGXxt0fzgTtpA1MLAx1PRed6AJbeCHyW",
    //         pass: "PryJOjM8f14tk2mUDJ56b8pbpeKDoglP"
    //     }
    // })
    // await transport.sendMail({
    //     subject, text, from, to
    // }).then(() => {
        
    //     console.log("Email sent")
    // }).catch(error => {
    //     console.log(error)
    // })
    console.log(`User created: ${user}`)
    if (user) {
        res.status(201).json({_id: user.id, email: user.email, message: "User registered successfully."})
    } else {
        res.status(400)
        throw new Error("Invalid user data")
    }
    
})

// const verifyOtp = asyncHandler (async (req, res) => {
//     res.json(otp)
// })

const loginUser = asyncHandler (async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email})
    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({
            user: {
                username: user.username,
                email: user.email,
                id: user._id
            }
        }, process.env.SECRET,
    {expiresIn: "24h"})
    
    res.status(200).json({token, user})
    } else {
        res.status(400)
        throw new Error("Email or password is not valid")
    }
    
})

const allUsers = asyncHandler (async (req, res) => {
    try {
        const users = await User.find()
    res.status(200).json(users)
    } catch (error) {
        console.log(error)
    }
    
})

const currentUser = asyncHandler (async (req, res) => {
    console.log(req.user)
    res.json(req.user)
})

// get friend request
const getFriendRequests = asyncHandler(async(req, res) => {
    try {
        const users = await User.find({ 
            _id: { $ne: req.params.userId }, 
            "friendRequests.senderId": { $ne: req.params.userId } // Exclude users who have received a request from loginUserId
        }).populate("friendRequests");
        res.status(200).json(users.friendRequests);
    } catch (error) {
        res.status(400)
        throw new Error("Error fetching friend requests")
    }
})

const getSentRequests = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('friendRequests');
            
        const sentRequests = user.friendRequests
            .filter(req => req.status === 'pending')
            .map(req => req.recipientId.toString());

        res.status(200).json(sentRequests);
    } catch (error) {
        console.error("Error fetching sent requests:", error);
        res.status(400).json({ message: "Error fetching sent requests" });
    }
});

const allUsersExceptMe = asyncHandler(async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);
        
        const users = await User.aggregate([
            // Stage 1: Exclude current user
            { $match: { _id: { $ne: userId } } },
            
            // Stage 2: Lookup sent pending requests
            {
                $lookup: {
                    from: "users",
                    let: { currentUserId: userId },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$currentUserId"] } } },
                        { $unwind: "$friendRequests" },
                        { 
                            $match: { 
                                "friendRequests.status": "pending",
                                "friendRequests.createdAt": { 
                                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                                }
                            } 
                        },
                        { $group: { 
                            _id: null, 
                            sentIds: { $addToSet: "$friendRequests.recipientId" } 
                        }}
                    ],
                    as: "sentRequests"
                }
            },
            
            // Stage 3: Filter users not in sentIds
            { $match: { 
                $expr: { 
                    $not: { 
                        $in: ["$_id", { $ifNull: [{ $arrayElemAt: ["$sentRequests.sentIds", 0] }, []] }] 
                    } 
                } 
            }},
            
            // Stage 4: Project final fields
            { $project: { 
                password: 0,
                friendRequests: 0,
                sentRequests: 0 
            }}
        ]);

        res.status(200).json(users);
    } catch (error) {
        console.error("Aggregation error:", error);
        res.status(500).json({ message: "Error fetching filtered users" });
    }
});

const sendFriendRequest = asyncHandler(async (req, res) => {
    try {
        const { senderId, recipientId } = req.body;
        
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(senderId) || 
            !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // Check for existing request
        const existingRequest = await User.findOne({
            _id: senderId,
            'friendRequests.recipientId': recipientId
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Request already sent" });
        }

        // Update sender
        await User.findByIdAndUpdate(senderId, {
            $push: {
                friendRequests: {
                    recipientId: recipientId,
                    status: 'pending',
                    createdAt: new Date()
                }
            }
        });

        // Update recipient
        await User.findByIdAndUpdate(recipientId, {
            $push: {
                friendRequests: {
                    senderId: senderId,
                    status: 'pending',
                    createdAt: new Date()
                }
            }
        });

        res.status(200).json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Friend request error:", error);
        res.status(500).json({ message: "Error sending friend request" });
    }
});

module.exports = {
    registerUser,
    loginUser,
    currentUser,
    allUsers,
    getFriendRequests,
    getSentRequests,
    allUsersExceptMe,
    sendFriendRequest
}