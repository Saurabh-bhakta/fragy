const express = require('express');
const { protect } = require('../middleware/auth');
const ensureProfileComplete = require('../middleware/profileComplete');
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

router.post('/', protect, ensureProfileComplete, createGroup);
router.get('/', protect, ensureProfileComplete, getGroups);
router.get('/:groupId', protect, ensureProfileComplete, getGroupById);
router.post('/:groupId/join', protect, ensureProfileComplete, requestToJoin);
router.get('/:groupId/pending-requests', protect, ensureProfileComplete, getPendingRequests);
router.post('/:groupId/handle-request', protect, ensureProfileComplete, handleJoinRequest);
router.get('/:groupId/participants', protect, ensureProfileComplete, getGroupParticipants);
router.get('/:groupId/available-users', protect, ensureProfileComplete, getAvailableUsersForGroup);
router.post('/:groupId/members', protect, ensureProfileComplete, addMemberToGroup);
router.delete('/:groupId/members/:userId', protect, ensureProfileComplete, removeParticipant);

module.exports = router;
