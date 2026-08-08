const SiteSettings = require('../models/SiteSettings');

const DEFAULTS = {
  key: 'main',
  aboutIntro:
    'Fragy is a learning project that brings semester-wise notes, slides, and previous-year questions into one calm, student-friendly place.',
  owner: {
    name: 'Fragy Owner',
    role: 'Platform owner',
    email: '',
    phone: '',
    bio: 'Edit this section from the Admin panel to share your details with students.',
    links: '',
  },
  contentProvider: {
    name: 'Content Provider',
    role: 'Notes & materials',
    email: '',
    phone: '',
    bio: 'Edit this section from the Admin panel to credit the person who provides study materials.',
    links: '',
  },
};

async function getOrCreateSettings() {
  let settings = await SiteSettings.findOne({ key: 'main' });
  if (!settings) {
    settings = await SiteSettings.create(DEFAULTS);
  }
  return settings;
}

function serialize(settings) {
  return {
    aboutIntro: settings.aboutIntro,
    owner: {
      name: settings.owner?.name || '',
      role: settings.owner?.role || '',
      email: settings.owner?.email || '',
      phone: settings.owner?.phone || '',
      bio: settings.owner?.bio || '',
      links: settings.owner?.links || '',
    },
    contentProvider: {
      name: settings.contentProvider?.name || '',
      role: settings.contentProvider?.role || '',
      email: settings.contentProvider?.email || '',
      phone: settings.contentProvider?.phone || '',
      bio: settings.contentProvider?.bio || '',
      links: settings.contentProvider?.links || '',
    },
    updatedAt: settings.updatedAt,
  };
}

/** GET /api/about — public */
async function getAbout(req, res) {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ about: serialize(settings) });
  } catch (err) {
    console.error('getAbout error:', err);
    return res.status(500).json({ message: 'Failed to load about information.' });
  }
}

/** GET /api/admin/about */
async function adminGetAbout(req, res) {
  try {
    const settings = await getOrCreateSettings();
    return res.json({ about: serialize(settings) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load about settings.' });
  }
}

/** PUT /api/admin/about */
async function adminUpdateAbout(req, res) {
  try {
    const settings = await getOrCreateSettings();
    const { aboutIntro, owner, contentProvider } = req.body;

    if (typeof aboutIntro === 'string') {
      settings.aboutIntro = aboutIntro.trim().slice(0, 2000);
      settings.markModified('aboutIntro');
    }

    if (owner && typeof owner === 'object') {
      settings.owner = {
        name: String(owner.name || '').trim().slice(0, 120),
        role: String(owner.role || '').trim().slice(0, 120),
        email: String(owner.email || '').trim().slice(0, 160),
        phone: String(owner.phone || '').trim().slice(0, 40),
        bio: String(owner.bio || '').trim().slice(0, 1000),
        links: String(owner.links || '').trim().slice(0, 300),
      };
      settings.markModified('owner');
    }

    if (contentProvider && typeof contentProvider === 'object') {
      settings.contentProvider = {
        name: String(contentProvider.name || '').trim().slice(0, 120),
        role: String(contentProvider.role || '').trim().slice(0, 120),
        email: String(contentProvider.email || '').trim().slice(0, 160),
        phone: String(contentProvider.phone || '').trim().slice(0, 40),
        bio: String(contentProvider.bio || '').trim().slice(0, 1000),
        links: String(contentProvider.links || '').trim().slice(0, 300),
      };
      settings.markModified('contentProvider');
    }

    await settings.save();
    return res.json({
      message: 'About & owner details saved successfully.',
      about: serialize(settings),
    });
  } catch (err) {
    console.error('adminUpdateAbout error:', err);
    return res.status(500).json({ message: 'Failed to save about settings.' });
  }
}

module.exports = {
  getAbout,
  adminGetAbout,
  adminUpdateAbout,
  getOrCreateSettings,
};
