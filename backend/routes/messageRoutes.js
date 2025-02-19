const express = require("express")
const validateToken = require("../middleware/validateToken")
const {postMessage, userConversation, groupConversation, communityConversation} = require("../controllers/messageController")

const router = express.Router()

router.use(validateToken)

router.get("/user/:receiverId", userConversation) // get messages between users
router.get("/group/:groupId", groupConversation) // get messages from a group
router.get("/community/:communityId", communityConversation) // get messages from communities //// this wont be required as in community there are no messages as such, only announcements
router.post("/:receiverType/:receiverId", postMessage) //post a message to a user/ group or community






module.exports = router;