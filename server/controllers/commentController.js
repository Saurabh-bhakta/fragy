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
        userId: c.userId,
        authorName: c.authorName,
        message: c.message,
        isEdited: c.isEdited || false,
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
        userId: comment.userId,
        authorName: comment.authorName,
        message: comment.message,
        isEdited: false,
        createdAt: comment.createdAt,
      },
    });
  } catch (err) {
    console.error('createComment error:', err);
    return res.status(500).json({ message: 'Could not post comment.' });
  }
}

/** PUT /api/comments/:id — user update within 5 minutes of creation */
async function updateComment(req, res) {
  try {
    const { id } = req.params;
    const message = String(req.body.message || '').trim();

    if (message.length < 2 || message.length > 500) {
      return res.status(400).json({ message: 'Comment must be between 2 and 500 characters.' });
    }

    const comment = await Comment.findById(id);
    if (!comment || !comment.isVisible) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Must be the original author
    if (comment.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own comments.' });
    }

    // 5-minute time window check (5 * 60 * 1000 = 300,000 ms)
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const timeElapsed = Date.now() - new Date(comment.createdAt).getTime();
    if (timeElapsed > FIVE_MINUTES_MS) {
      return res.status(403).json({
        message: 'Editing time limit expired. Comments can only be edited within 5 minutes of posting.',
      });
    }

    comment.message = message;
    comment.isEdited = true;
    await comment.save();

    return res.json({
      message: 'Comment updated successfully.',
      comment: {
        id: comment._id,
        userId: comment.userId,
        authorName: comment.authorName,
        message: comment.message,
        isEdited: true,
        createdAt: comment.createdAt,
      },
    });
  } catch (err) {
    console.error('updateComment error:', err);
    return res.status(500).json({ message: 'Failed to update comment.' });
  }
}

/** GET /api/admin/comments — list all comments for admin management */
async function adminListComments(req, res) {
  try {
    const comments = await Comment.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      comments: comments.map((c) => ({
        id: c._id,
        userId: c.userId,
        authorName: c.authorName,
        message: c.message,
        isEdited: c.isEdited || false,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error('adminListComments error:', err);
    return res.status(500).json({ message: 'Failed to load admin comments.' });
  }
}

/** DELETE /api/admin/comments/:id — delete comment permanently (admin only) */
async function adminDeleteComment(req, res) {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    return res.json({ message: 'Comment deleted successfully.', comment });
  } catch (err) {
    console.error('adminDeleteComment error:', err);
    return res.status(500).json({ message: 'Failed to delete comment.' });
  }
}

module.exports = {
  listComments,
  createComment,
  updateComment,
  adminListComments,
  adminDeleteComment,
};
