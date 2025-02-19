const express = require("express")
const { allUsers, registerUser, loginUser, currentUser, getFriendRequests, allUsersExceptMe, sendFriendRequest } = require("../controllers/userController")
const validateToken = require("../middleware/validateToken")

const router = express.Router()

router.get("/", allUsers) // get all users
router.post("/register", registerUser) // register a user
router.post("/login", loginUser) // login a user
router.get("/current", validateToken, currentUser) // get current user, Always write validateToken before currentUser or you will receive undefined
router.get("/sent-requests/:userId", getFriendRequests) // get friend requests that were sent to you.
router.get('/all-except-me/:userId', allUsersExceptMe);
router.post("/friend-requests/send", validateToken, sendFriendRequest);

module.exports = router;