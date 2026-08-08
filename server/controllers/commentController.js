const Comment = require('../models/Comment');

/** GET /api/comments — public list (newest first) */
async function listComments(req, res) {
  try {
    const comments = await Comment.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      comments: comments.map((c) => ({
        id: c._id,
        authorName: c.authorName,
        message: c.message,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('listComments error:', err);
    return res.status(500).json({ message: 'Failed to load comments.' });
  }
}

/** POST /api/comments — authenticated */
async function createComment(req, res) {
  try {
    const message = String(req.body.message || '').trim();

    if (message.length < 2 || message.length > 500) {
      return res.status(400).json({ message: 'Comment must be between 2 and 500 characters.' });
    }

    const comment = await Comment.create({
      userId: req.user.id,
      authorName: req.user.name,
      message,
    });

    return res.status(201).json({
      message: 'Comment posted.',
      comment: {
        id: comment._id,
        authorName: comment.authorName,
        message: comment.message,
        createdAt: comment.createdAt,
      },
    });
  } catch (err) {
    console.error('createComment error:', err);
    return res.status(500).json({ message: 'Could not post comment.' });
  }
}

/** DELETE /api/admin/comments/:id — soft-hide (admin only, wired from admin routes) */
async function hideComment(req, res) {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { isVisible: false },
      { new: true }
    );
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    return res.json({ message: 'Comment hidden.', comment });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to hide comment.' });
  }
}

module.exports = { listComments, createComment, hideComment };
