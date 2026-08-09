const User = require('../models/User');

/** GET /api/members — List registered members with search and pagination */
async function getMembers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const search = (req.query.q || '').trim();

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name avatarUrl bio createdAt role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const members = users.map((u) => ({
      id: u._id,
      name: u.name,
      avatarUrl: u.avatarUrl,
      bio: u.bio || '',
      role: u.role,
      createdAt: u.createdAt,
      isSelf: String(u._id) === String(req.user.id),
    }));

    return res.json({
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('getMembers error:', err);
    return res.status(500).json({ message: 'Could not fetch members list.' });
  }
}

module.exports = { getMembers };
