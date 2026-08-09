const express = require('express');
const { protect } = require('../middleware/auth');
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

router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId/messages', protect, getPrivateMessages);
router.post('/conversations/:conversationId/messages', protect, sendPrivateMessage);

router.get('/groups/:groupId/messages', protect, getGroupMessages);
router.post('/groups/:groupId/messages', protect, sendGroupMessage);

router.put('/messages/:messageId', protect, editMessage);
router.delete('/messages/:messageId', protect, deleteMessage);

module.exports = router;
