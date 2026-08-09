const Semester = require('../models/Semester');
const Subject = require('../models/Subject');
const Resource = require('../models/Resource');

/** GET /api/semesters — public list */
async function listSemesters(req, res) {
  try {
    const semesters = await Semester.find({ isActive: true }).sort({ number: 1 }).lean();

    // Attach subject counts for nicer cards
    const withCounts = await Promise.all(
      semesters.map(async (sem) => {
        const subjectCount = await Subject.countDocuments({ semesterId: sem._id, isActive: true });
        return { ...sem, id: sem._id, subjectCount };
      })
    );

    return res.json({ semesters: withCounts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load semesters.' });
  }
}

/** GET /api/semesters/:idOrNumber */
async function getSemester(req, res) {
  try {
    const { idOrNumber } = req.params;
    const query = /^\d+$/.test(idOrNumber)
      ? { number: Number(idOrNumber), isActive: true }
      : { _id: idOrNumber, isActive: true };

    const semester = await Semester.findOne(query).lean();
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found.' });
    }

    const subjects = await Subject.find({ semesterId: semester._id, isActive: true })
      .sort({ name: 1 })
      .lean();

    return res.json({
      semester: { ...semester, id: semester._id },
      subjects: subjects.map((s) => ({ ...s, id: s._id })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load semester.' });
  }
}

/** GET /api/subjects/:subjectId — subject + grouped resources (metadata only) */
async function getSubject(req, res) {
  try {
    const subject = await Subject.findOne({ _id: req.params.subjectId, isActive: true })
      .populate('semesterId')
      .lean();

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    const resources = await Resource.find({ subjectId: subject._id, isActive: true })
      .select('title type driveUrl description requiresAuth createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const grouped = { notes: [], slides: [], pyqs: [] };
    for (const r of resources) {
      if (grouped[r.type]) {
        grouped[r.type].push({
          id: r._id,
          title: r.title,
          type: r.type,
          driveUrl: r.driveUrl,
          description: r.description,
          requiresAuth: r.requiresAuth,
        });
      }
    }

    return res.json({
      subject: {
        id: subject._id,
        name: subject.name,
        code: subject.code,
        semesterId: subject.semesterId?._id || subject.semesterId,
        semesterNumber: subject.semesterId?.number,
        semesterName: subject.semesterId?.name,
      },
      resources: grouped,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to load subject.' });
  }
}

/**
 * GET /api/resources/:resourceId/access
 * Authenticated endpoint that returns the Drive URL after login.
 * Frontend should still show the educational-use confirmation modal.
 */
async function accessResource(req, res) {
  try {
    const resource = await Resource.findOne({ _id: req.params.resourceId, isActive: true }).lean();
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    let driveUrl = resource.driveUrl || '';
    if (driveUrl && !/^https?:\/\//i.test(driveUrl)) {
      driveUrl = 'https://' + driveUrl;
    }

    return res.json({
      id: resource._id,
      title: resource.title,
      type: resource.type,
      description: resource.description,
      driveUrl,
      notice:
        'These materials are provided for educational purposes. Please respect the effort of the creator and do not redistribute them without permission.',
    });
  } catch (err) {
    console.error('accessResource error:', err);
    return res.status(500).json({ message: 'Failed to access resource.' });
  }
}

module.exports = {
  listSemesters,
  getSemester,
  getSubject,
  accessResource,
};
