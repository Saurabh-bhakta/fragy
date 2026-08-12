const express = require('express');
const { protect } = require('../middleware/auth');
const ensureProfileComplete = require('../middleware/profileComplete');
const {
  getOrCreateConversation,
  getConversations,
  getPrivateMessages,
  sendPrivateMessage,
  getGroupMessages,
  sendGroupMessage,
  editMessage,
  deleteMessage,
} = require('../controllers/chatController');

const router = express.Router();

router.post('/conversations', protect, ensureProfileComplete, getOrCreateConversation);
router.get('/conversations', protect, ensureProfileComplete, getConversations);
router.get('/conversations/:conversationId/messages', protect, ensureProfileComplete, getPrivateMessages);
router.post('/conversations/:conversationId/messages', protect, ensureProfileComplete, sendPrivateMessage);

router.get('/groups/:groupId/messages', protect, ensureProfileComplete, getGroupMessages);
router.post('/groups/:groupId/messages', protect, ensureProfileComplete, sendGroupMessage);

router.put('/messages/:messageId', protect, ensureProfileComplete, editMessage);
router.delete('/messages/:messageId', protect, ensureProfileComplete, deleteMessage);

module.exports = router;
