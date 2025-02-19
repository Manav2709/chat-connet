const express = require("express")
const { createCommunity, getAllCommunities, getCommunity, addGroupToCommunity, getCommunityGroups, kickOutGroup, postAnnouncement, deleteCommunity } = require("../controllers/communityController")
const validateToken = require("../middleware/validateToken")

const router = express.Router()
router.use(validateToken)

router.get("/", getAllCommunities) // get all communities.
router.get("/:communityId", getCommunity) // get a particular community.
router.post("/create", createCommunity) // create a community.
router.put("/:communityId/add/groups", addGroupToCommunity) // add groups to communities. // you can pass the id in the path as well and we can fetch it in the controller.
router.put("/:communityId/announcement", postAnnouncement) // add announcements (These are just admin sending messages in the community.)
router.get("/:communityId/groups", getCommunityGroups) // get groups in a community.
router.delete("/:communityId/group/delete/:groupId", kickOutGroup) // deletes a group from a community.
router.delete("/:communityId/delete", deleteCommunity) // delete a community



module.exports = router;