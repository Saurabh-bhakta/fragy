const User = require('../models/User');
const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const Resource = require('../models/Resource');

/** GET /api/admin/users */
async function listUsers(req, res) {
  try {
    const users = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load users.' });
  }
}

/** POST /api/admin/semesters */
async function createSemester(req, res) {
  try {
    const { name, number, description } = req.body;
    const semester = await Semester.create({
      name,
      number: Number(number),
      description: description || '',
    });
    return res.status(201).json({ semester });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A semester with that number already exists.' });
    }
    return res.status(500).json({ message: 'Failed to create semester.' });
  }
}

/** PATCH /api/admin/semesters/:id */
async function updateSemester(req, res) {
  try {
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      {
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.isActive !== undefined && { isActive: Boolean(req.body.isActive) }),
        ...(req.body.number !== undefined && { number: Number(req.body.number) }),
      },
      { new: true, runValidators: true }
    );
    if (!semester) return res.status(404).json({ message: 'Semester not found.' });
    return res.json({ semester });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update semester.' });
  }
}

/** POST /api/admin/subjects */
async function createSubject(req, res) {
  try {
    const { name, code, semesterId } = req.body;
    const semester = await Semester.findById(semesterId);
    if (!semester) return res.status(404).json({ message: 'Semester not found.' });

    const subject = await Subject.create({ name, code: code || '', semesterId });
    return res.status(201).json({ subject });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create subject.' });
  }
}

/** PATCH /api/admin/subjects/:id */
async function updateSubject(req, res) {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.code !== undefined && { code: req.body.code }),
        ...(req.body.isActive !== undefined && { isActive: Boolean(req.body.isActive) }),
      },
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    return res.json({ subject });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update subject.' });
  }
}

/** POST /api/admin/resources */
async function createResource(req, res) {
  try {
    let { title, type, subjectId, driveUrl, description } = req.body;
    if (!['notes', 'slides', 'pyqs'].includes(type)) {
      return res.status(400).json({ message: 'type must be notes, slides, or pyqs.' });
    }

    if (driveUrl && !/^https?:\/\//i.test(driveUrl)) {
      driveUrl = 'https://' + driveUrl;
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });

    const resource = await Resource.create({
      title,
      type,
      subjectId,
      driveUrl,
      description: description || '',
    });
    return res.status(201).json({ resource });
  } catch (err) {
    console.error('createResource error:', err);
    return res.status(500).json({ message: 'Failed to create resource. ' + (err.message || '') });
  }
}

/** PATCH /api/admin/resources/:id */
async function updateResource(req, res) {
  try {
    const allowed = ['title', 'type', 'driveUrl', 'description', 'isActive', 'requiresAuth'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const resource = await Resource.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    return res.json({ resource });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update resource.' });
  }
}

/** GET /api/admin/resources — list all uploaded materials */
async function listResources(req, res) {
  try {
    const resources = await Resource.find({ isActive: true })
      .populate({
        path: 'subjectId',
        select: 'name code semesterId',
        populate: { path: 'semesterId', select: 'name number' },
      })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ resources });
  } catch (err) {
    console.error('listResources error:', err);
    return res.status(500).json({ message: 'Failed to list resources.' });
  }
}

/** DELETE /api/admin/resources/:id — delete resource */
async function removeResource(req, res) {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });
    return res.json({ message: 'Resource deleted successfully.', resource });
  } catch (err) {
    console.error('removeResource error:', err);
    return res.status(500).json({ message: 'Failed to remove resource.' });
  }
}

/** GET /api/admin/overview — quick dashboard numbers */
async function overview(req, res) {
  try {
    const [users, semesters, subjects, resources] = await Promise.all([
      User.countDocuments(),
      Semester.countDocuments(),
      Subject.countDocuments({ isActive: true }),
      Resource.countDocuments({ isActive: true }),
    ]);
    return res.json({ users, semesters, subjects, resources });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load overview.' });
  }
}

module.exports = {
  listUsers,
  createSemester,
  updateSemester,
  createSubject,
  updateSubject,
  listResources,
  createResource,
  updateResource,
  removeResource,
  overview,
};

