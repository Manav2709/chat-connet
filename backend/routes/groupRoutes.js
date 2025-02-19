const express = require("express")
const { createGroup, getGroups, findGroup, addMembersToGroup, getMembersOfParticularGroup, deleteGroup } = require("../controllers/groupController")
const validateToken = require("../middleware/validateToken")

const router = express.Router()
router.use(validateToken)

router.get("/", getGroups) // get all groups
router.get("/:groupId", findGroup) // get a group by id
router.post("/create", createGroup) // create a group
router.put("/add/members/:groupId", addMembersToGroup) // add members to existing groups
router.get("/members/:groupId", getMembersOfParticularGroup) // get members of a particular group 
router.delete("/delete/:groupId", deleteGroup)
// router.get("/community/:communityId") // get communities the group is a part of.




module.exports = router;