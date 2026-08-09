const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createGroup,
  getGroups,
  getGroupById,
  requestToJoin,
  getPendingRequests,
  handleJoinRequest,
  getGroupParticipants,
  getAvailableUsersForGroup,
  addMemberToGroup,
  removeParticipant,
} = require('../controllers/groupController');

const router = express.Router();

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/:groupId', protect, getGroupById);
router.post('/:groupId/join', protect, requestToJoin);
router.get('/:groupId/pending-requests', protect, getPendingRequests);
router.post('/:groupId/handle-request', protect, handleJoinRequest);
router.get('/:groupId/participants', protect, getGroupParticipants);
router.get('/:groupId/available-users', protect, getAvailableUsersForGroup);
router.post('/:groupId/members', protect, addMemberToGroup);
router.delete('/:groupId/members/:userId', protect, removeParticipant);

module.exports = router;
