const Group = require('../models/Group');
const GroupMembership = require('../models/GroupMembership');
const User = require('../models/User');

/** POST /api/groups — Create a new group with optional initial members */
async function createGroup(req, res) {
  try {
    const { name, description, avatarUrl, initialMemberIds } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const group = await Group.create({
      name: name.trim().slice(0, 100),
      description: (description || '').trim().slice(0, 500),
      avatarUrl: (avatarUrl || '').trim(),
      createdBy: req.user.id,
    });

    // Creator automatically becomes Group Admin with accepted status
    await GroupMembership.create({
      group: group._id,
      user: req.user.id,
      status: 'accepted',
      role: 'admin',
    });

    // Add selected initial members if provided
    if (Array.isArray(initialMemberIds) && initialMemberIds.length > 0) {
      const validUserIds = initialMemberIds.filter(
        (id) => String(id) !== String(req.user.id)
      );

      if (validUserIds.length > 0) {
        const existingUsers = await User.find({ _id: { $in: validUserIds } }).select('_id');
        const membershipsToCreate = existingUsers.map((u) => ({
          group: group._id,
          user: u._id,
          status: 'accepted',
          role: 'member',
        }));

        if (membershipsToCreate.length > 0) {
          await GroupMembership.insertMany(membershipsToCreate, { ordered: false }).catch((err) => {
            console.warn('Some initial memberships already existed:', err.message);
          });
        }
      }
    }

    return res.status(201).json({
      message: 'Group created successfully!',
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        avatarUrl: group.avatarUrl,
        createdBy: group.createdBy,
        createdAt: group.createdAt,
      },
    });
  } catch (err) {
    console.error('createGroup error:', err);
    return res.status(500).json({ message: 'Could not create group.' });
  }
}

/** GET /api/groups — List all groups with user membership status */
async function getGroups(req, res) {
  try {
    const groups = await Group.find()
      .populate('createdBy', 'name avatarUrl')
      .sort({ createdAt: -1 });

    const groupIds = groups.map((g) => g._id);

    // Get current user's membership records for these groups
    const myMemberships = await GroupMembership.find({
      group: { $in: groupIds },
      user: req.user.id,
    });
    const myMembershipMap = {};
    myMemberships.forEach((m) => {
      myMembershipMap[String(m.group)] = m;
    });

    // Get accepted member counts for each group
    const counts = await GroupMembership.aggregate([
      { $match: { group: { $in: groupIds }, status: 'accepted' } },
      { $group: { _id: '$group', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      countMap[String(c._id)] = c.count;
    });

    const result = groups.map((g) => {
      const mem = myMembershipMap[String(g._id)];
      return {
        id: g._id,
        name: g.name,
        description: g.description,
        avatarUrl: g.avatarUrl,
        createdBy: g.createdBy ? { id: g.createdBy._id, name: g.createdBy.name } : null,
        createdAt: g.createdAt,
        memberCount: countMap[String(g._id)] || 0,
        membershipStatus: mem ? mem.status : 'none',
        isGroupAdmin: mem ? mem.role === 'admin' : String(g.createdBy?._id) === String(req.user.id),
      };
    });

    return res.json({ groups: result });
  } catch (err) {
    console.error('getGroups error:', err);
    return res.status(500).json({ message: 'Could not fetch groups.' });
  }
}

/** GET /api/groups/:groupId — Details of a specific group */
async function getGroupById(req, res) {
  try {
    const group = await Group.findById(req.params.groupId).populate('createdBy', 'name avatarUrl');
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const membership = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
    });

    const memberCount = await GroupMembership.countDocuments({
      group: group._id,
      status: 'accepted',
    });

    return res.json({
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        avatarUrl: group.avatarUrl,
        createdBy: group.createdBy ? { id: group.createdBy._id, name: group.createdBy.name } : null,
        createdAt: group.createdAt,
        memberCount,
        membershipStatus: membership ? membership.status : 'none',
        isGroupAdmin: membership ? membership.role === 'admin' : String(group.createdBy?._id) === String(req.user.id),
      },
    });
  } catch (err) {
    console.error('getGroupById error:', err);
    return res.status(500).json({ message: 'Could not fetch group details.' });
  }
}

/** POST /api/groups/:groupId/join — Request to join group */
async function requestToJoin(req, res) {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    let membership = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
    });

    if (membership) {
      if (membership.status === 'accepted') {
        return res.status(400).json({ message: 'You are already a member of this group.' });
      }
      if (membership.status === 'pending') {
        return res.status(400).json({ message: 'Your join request is already pending approval by the Group Admin.' });
      }
      // Re-request if previously rejected or removed
      membership.status = 'pending';
      await membership.save();
    } else {
      membership = await GroupMembership.create({
        group: group._id,
        user: req.user.id,
        status: 'pending',
        role: 'member',
      });
    }

    return res.json({
      message: 'Join request submitted! Awaiting approval from Group Admin.',
      membershipStatus: 'pending',
    });
  } catch (err) {
    console.error('requestToJoin error:', err);
    return res.status(500).json({ message: 'Could not submit join request.' });
  }
}

/** GET /api/groups/:groupId/pending-requests — Group Admin views pending join requests */
async function getPendingRequests(req, res) {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const adminMem = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      role: 'admin',
      status: 'accepted',
    });

    if (!adminMem && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the Group Admin can view pending requests.' });
    }

    const pending = await GroupMembership.find({
      group: group._id,
      status: 'pending',
    }).populate('user', 'name avatarUrl bio createdAt');

    const requests = pending.map((p) => ({
      membershipId: p._id,
      user: {
        id: p.user._id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl,
        bio: p.user.bio || '',
        createdAt: p.user.createdAt,
      },
      requestedAt: p.createdAt,
    }));

    return res.json({ requests });
  } catch (err) {
    console.error('getPendingRequests error:', err);
    return res.status(500).json({ message: 'Could not fetch pending requests.' });
  }
}

/** POST /api/groups/:groupId/handle-request — Accept or Reject join request */
async function handleJoinRequest(req, res) {
  try {
    const { membershipId, action } = req.body; // action: 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "accept" or "reject".' });
    }

    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const adminMem = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      role: 'admin',
      status: 'accepted',
    });

    if (!adminMem && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the Group Admin can manage join requests.' });
    }

    const targetMembership = await GroupMembership.findById(membershipId);
    if (!targetMembership || String(targetMembership.group) !== String(group._id)) {
      return res.status(404).json({ message: 'Join request not found.' });
    }

    targetMembership.status = action === 'accept' ? 'accepted' : 'rejected';
    await targetMembership.save();

    return res.json({
      message: `Join request ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`,
      membership: {
        id: targetMembership._id,
        status: targetMembership.status,
      },
    });
  } catch (err) {
    console.error('handleJoinRequest error:', err);
    return res.status(500).json({ message: 'Could not update join request status.' });
  }
}

/** GET /api/groups/:groupId/participants — List accepted group members */
async function getGroupParticipants(req, res) {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Verify current user is an accepted member or group admin
    const myMem = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      status: 'accepted',
    });

    if (!myMem && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only accepted members can view group participants.' });
    }

    const memberships = await GroupMembership.find({
      group: group._id,
      status: 'accepted',
    }).populate('user', 'name avatarUrl bio createdAt');

    const participants = memberships.map((m) => ({
      userId: m.user._id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      bio: m.user.bio || '',
      role: m.role,
      isGroupAdmin: m.role === 'admin' || String(group.createdBy) === String(m.user._id),
      joinedAt: m.updatedAt || m.createdAt,
    }));

    return res.json({ participants });
  } catch (err) {
    console.error('getGroupParticipants error:', err);
    return res.status(500).json({ message: 'Could not fetch group participants.' });
  }
}

/** GET /api/groups/:groupId/available-users — Group Admin searches registered users available to add */
async function getAvailableUsersForGroup(req, res) {
  try {
    const { groupId } = req.params;
    const q = req.query.q ? String(req.query.q).trim() : '';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Verify current user is Group Admin
    const adminMem = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      role: 'admin',
      status: 'accepted',
    });

    if (!adminMem && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only Group Admin can search users to add.' });
    }

    // Get all user IDs already accepted or pending in this group
    const existingMemberships = await GroupMembership.find({
      group: group._id,
      status: { $in: ['accepted', 'pending'] },
    }).select('user');

    const excludedUserIds = existingMemberships.map((m) => m.user);
    excludedUserIds.push(req.user.id);

    const query = {
      _id: { $nin: excludedUserIds },
    };

    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name avatarUrl bio createdAt')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        bio: u.bio || '',
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getAvailableUsersForGroup error:', err);
    return res.status(500).json({ message: 'Could not fetch available users.' });
  }
}

/** POST /api/groups/:groupId/members — Group Admin directly adds a user */
async function addMemberToGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Verify current user is Group Admin
    const adminMem = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      role: 'admin',
      status: 'accepted',
    });

    if (!adminMem && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only Group Admin can add members directly.' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let membership = await GroupMembership.findOne({
      group: group._id,
      user: targetUser._id,
    });

    if (membership && membership.status === 'accepted') {
      return res.status(400).json({ message: 'User is already an accepted member of this group.' });
    }

    if (membership) {
      membership.status = 'accepted';
      membership.role = 'member';
      await membership.save();
    } else {
      membership = await GroupMembership.create({
        group: group._id,
        user: targetUser._id,
        status: 'accepted',
        role: 'member',
      });
    }

    return res.status(201).json({
      message: `${targetUser.name} added to group successfully!`,
      membership: {
        id: membership._id,
        userId: targetUser._id,
        name: targetUser.name,
        avatarUrl: targetUser.avatarUrl,
        bio: targetUser.bio,
        role: membership.role,
        status: membership.status,
      },
    });
  } catch (err) {
    console.error('addMemberToGroup error:', err);
    return res.status(500).json({ message: 'Could not add member to group.' });
  }
}

/** DELETE /api/groups/:groupId/members/:userId — Group Admin removes a participant */
async function removeParticipant(req, res) {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Verify current user is Group Admin
    const adminMem = await GroupMembership.findOne({
      group: group._id,
      user: req.user.id,
      role: 'admin',
      status: 'accepted',
    });

    if (!adminMem && String(group.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only Group Admin can remove participants.' });
    }

    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({ message: 'Group Admin cannot remove themselves.' });
    }

    const targetMem = await GroupMembership.findOne({
      group: group._id,
      user: userId,
    });

    if (!targetMem) {
      return res.status(404).json({ message: 'Participant not found in this group.' });
    }

    if (targetMem.role === 'admin' || String(group.createdBy) === String(userId)) {
      return res.status(400).json({ message: 'Cannot remove Group Admin.' });
    }

    targetMem.status = 'removed';
    await targetMem.save();

    return res.json({ message: 'Participant removed from group successfully.' });
  } catch (err) {
    console.error('removeParticipant error:', err);
    return res.status(500).json({ message: 'Could not remove participant.' });
  }
}

module.exports = {
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
};
