const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Group = require('../models/Group');
const GroupMembership = require('../models/GroupMembership');

/** Helper to get socket server instance if available */
function getIo(req) {
  return req.app.get('io');
}

/** POST /api/chat/conversations — Get or create 1-to-1 conversation */
async function getOrCreateConversation(req, res) {
  try {
    const { recipientId } = req.body;
    if (!recipientId || String(recipientId) === String(req.user.id)) {
      return res.status(400).json({ message: 'Invalid recipient user ID.' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId], $size: 2 },
    }).populate('participants', 'name avatarUrl bio createdAt');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
      });
      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'name avatarUrl bio createdAt'
      );
    }

    return res.json({ conversation });
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    return res.status(500).json({ message: 'Could not open conversation.' });
  }
}

/** GET /api/chat/conversations — List all active private conversations */
async function getConversations(req, res) {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'name avatarUrl bio createdAt')
      .sort({ lastMessageAt: -1 });

    const result = conversations.map((c) => {
      const otherParticipant = c.participants.find(
        (p) => String(p._id) !== String(req.user.id)
      ) || c.participants[0];

      return {
        id: c._id,
        recipient: otherParticipant
          ? {
              id: otherParticipant._id,
              name: otherParticipant.name,
              avatarUrl: otherParticipant.avatarUrl,
              bio: otherParticipant.bio || '',
            }
          : null,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        createdAt: c.createdAt,
      };
    });

    return res.json({ conversations: result });
  } catch (err) {
    console.error('getConversations error:', err);
    return res.status(500).json({ message: 'Could not fetch conversations.' });
  }
}

/** GET /api/chat/conversations/:conversationId/messages — Private Chat Messages */
async function getPrivateMessages(req, res) {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (pId) => String(pId) === String(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this private conversation.' });
    }

    const messages = await Message.find({
      conversation: conversation._id,
      isDeleted: false,
    })
      .populate('sender', 'name avatarUrl')
      .sort({ createdAt: 1 });

    const formatted = messages.map((m) => {
      const createdAt = new Date(m.createdAt);
      const now = new Date();
      const ageMinutes = (now - createdAt) / (1000 * 60);

      const isSender = String(m.sender._id) === String(req.user.id);
      const canEdit = isSender && ageMinutes <= 5;
      const canDelete = isSender && ageMinutes <= 10;

      return {
        id: m._id,
        conversationId: m.conversation,
        sender: {
          id: m.sender._id,
          name: m.sender.name,
          avatarUrl: m.sender.avatarUrl,
        },
        content: m.content,
        isEdited: m.isEdited,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        isSelf: isSender,
        canEdit,
        canDelete,
      };
    });

    return res.json({ messages: formatted });
  } catch (err) {
    console.error('getPrivateMessages error:', err);
    return res.status(500).json({ message: 'Could not fetch messages.' });
  }
}

/** POST /api/chat/conversations/:conversationId/messages — Send Private Message */
async function sendPrivateMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.some(
      (pId) => String(pId) === String(req.user.id)
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this private conversation.' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      content: content.trim().slice(0, 2000),
    });

    conversation.lastMessage = message.content;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatarUrl');

    const formattedMessage = {
      id: populatedMessage._id,
      conversationId: populatedMessage.conversation,
      sender: {
        id: populatedMessage.sender._id,
        name: populatedMessage.sender.name,
        avatarUrl: populatedMessage.sender.avatarUrl,
      },
      content: populatedMessage.content,
      isEdited: false,
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
      isSelf: true,
      canEdit: true,
      canDelete: true,
    };

    // Emit Socket.io event if connected
    const io = getIo(req);
    if (io) {
      conversation.participants.forEach((pId) => {
        io.to(`user_${pId}`).emit('private_message', formattedMessage);
      });
    }

    return res.status(201).json({ message: formattedMessage });
  } catch (err) {
    console.error('sendPrivateMessage error:', err);
    return res.status(500).json({ message: 'Could not send message.' });
  }
}

/** GET /api/chat/groups/:groupId/messages — Group Chat Messages */
async function getGroupMessages(req, res) {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Verify current user has accepted status in GroupMembership
    const membership = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      status: 'accepted',
    });

    if (!membership && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only accepted group members can view group messages.' });
    }

    const isGroupAdmin = (membership && membership.role === 'admin') || String(group.createdBy) === String(req.user.id);

    const messages = await Message.find({
      group: group._id,
      isDeleted: false,
    })
      .populate('sender', 'name avatarUrl')
      .sort({ createdAt: 1 });

    const formatted = messages.map((m) => {
      const createdAt = new Date(m.createdAt);
      const now = new Date();
      const ageMinutes = (now - createdAt) / (1000 * 60);

      const isSender = String(m.sender._id) === String(req.user.id);
      const canEdit = isSender && ageMinutes <= 5;
      // Normal user: delete within 10 mins. Group Admin: can delete ANY message in group unrestricted by 10 mins!
      const canDelete = (isSender && ageMinutes <= 10) || isGroupAdmin;

      return {
        id: m._id,
        groupId: m.group,
        sender: {
          id: m.sender._id,
          name: m.sender.name,
          avatarUrl: m.sender.avatarUrl,
        },
        content: m.content,
        isEdited: m.isEdited,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        isSelf: isSender,
        canEdit,
        canDelete,
      };
    });

    return res.json({ messages: formatted });
  } catch (err) {
    console.error('getGroupMessages error:', err);
    return res.status(500).json({ message: 'Could not fetch group messages.' });
  }
}

/** POST /api/chat/groups/:groupId/messages — Send Group Message */
async function sendGroupMessage(req, res) {
  try {
    const { groupId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Verify current user has accepted status in GroupMembership
    const membership = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      status: 'accepted',
    });

    if (!membership && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only accepted group members can post messages.' });
    }

    const message = await Message.create({
      group: group._id,
      sender: req.user.id,
      content: content.trim().slice(0, 2000),
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatarUrl');

    const formattedMessage = {
      id: populatedMessage._id,
      groupId: populatedMessage.group,
      sender: {
        id: populatedMessage.sender._id,
        name: populatedMessage.sender.name,
        avatarUrl: populatedMessage.sender.avatarUrl,
      },
      content: populatedMessage.content,
      isEdited: false,
      createdAt: populatedMessage.createdAt,
      updatedAt: populatedMessage.updatedAt,
      isSelf: true,
      canEdit: true,
      canDelete: true,
    };

    // Emit Socket.io event to group room
    const io = getIo(req);
    if (io) {
      io.to(`group_${group._id}`).emit('group_message', formattedMessage);
    }

    return res.status(201).json({ message: formattedMessage });
  } catch (err) {
    console.error('sendGroupMessage error:', err);
    return res.status(500).json({ message: 'Could not send group message.' });
  }
}

/** PUT /api/chat/messages/:messageId — Edit message (5 Minute Rule) */
async function editMessage(req, res) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    // Only sender can edit their own message
    if (String(message.sender) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only edit your own messages.' });
    }

    // Check 5 Minute Edit Limit Rule
    const ageMinutes = (new Date() - new Date(message.createdAt)) / (1000 * 60);
    if (ageMinutes > 5) {
      return res.status(400).json({ message: 'Messages can only be edited within 5 minutes of sending.' });
    }

    message.content = content.trim().slice(0, 2000);
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    return res.json({
      message: 'Message updated successfully!',
      updatedMessage: {
        id: message._id,
        content: message.content,
        isEdited: true,
        editedAt: message.editedAt,
      },
    });
  } catch (err) {
    console.error('editMessage error:', err);
    return res.status(500).json({ message: 'Could not edit message.' });
  }
}

/** DELETE /api/chat/messages/:messageId — Delete message (10 Minute Rule or Group Admin) */
async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const isSender = String(message.sender) === String(req.user.id);
    const ageMinutes = (new Date() - new Date(message.createdAt)) / (1000 * 60);

    let isGroupAdmin = false;
    if (message.group) {
      const group = await Group.findById(message.group);
      if (group) {
        const membership = await GroupMembership.findOne({
          group: group._id,
          user: req.user.id,
          role: 'admin',
          status: 'accepted',
        });
        if (membership || String(group.createdBy) === String(req.user.id)) {
          isGroupAdmin = true;
        }
      }
    }

    // Check permissions
    if (isSender) {
      // Normal sender deletion restricted to 10 minutes
      if (ageMinutes > 10) {
        return res.status(400).json({ message: 'Messages can only be deleted within 10 minutes of sending.' });
      }
    } else if (!isGroupAdmin) {
      return res.status(403).json({ message: 'You do not have permission to delete this message.' });
    }

    message.isDeleted = true;
    await message.save();

    return res.json({ message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    return res.status(500).json({ message: 'Could not delete message.' });
  }
}

module.exports = {
  getOrCreateConversation,
  getConversations,
  getPrivateMessages,
  sendPrivateMessage,
  getGroupMessages,
  sendGroupMessage,
  editMessage,
  deleteMessage,
};
