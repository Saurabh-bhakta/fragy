/**
 * Seed script — creates admin user + sample semesters/subjects/resources.
 * Usage: cd server && npm run seed
 *
 * Pass --reset-subjects to replace existing subjects for seeded semesters.
 */
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');
const Semester = require('./models/Semester');
const Subject = require('./models/Subject');
const Resource = require('./models/Resource');

const RESET_SUBJECTS = process.argv.includes('--reset-subjects');

const SAMPLE = [
  {
    number: 1,
    name: 'Semester 1',
    description: 'Foundational first-year courses.',
    subjects: [
      { name: 'Introduction to Computing', code: 'CS101' },
      { name: 'Mathematics', code: 'MATH101' },
      { name: 'English', code: 'HS101' },
      { name: 'Happiness', code: 'HS102' },
      { name: 'Chemistry', code: 'CHY101' },
      { name: 'Workshop', code: 'WS101' },
      { name: 'Basic Electronics', code: 'EC101' },
    ],
  },
  {
    number: 2,
    name: 'Semester 2',
    description: 'Core second-semester science and engineering subjects.',
    subjects: [
      { name: 'Physics', code: 'PHY201' },
      { name: 'Mathematics', code: 'MATH201' },
      { name: 'DSA', code: 'CS201' },
      { name: 'Basic Electrical', code: 'EE201' },
      { name: 'Energy Environment And Climate Change', code: 'ES201' },
    ],
  },
  {
    number: 3,
    name: 'Semester 3',
    description: 'Core computing and mathematics subjects.',
    subjects: [
      {
        name: 'Digital Logic',
        code: 'CS301',
        resources: [
          {
            title: 'Unit 1 Notes',
            type: 'notes',
            description: 'Number systems and boolean algebra overview.',
            driveUrl: 'https://drive.google.com/file/d/example-dl-notes-1/view',
          },
          {
            title: 'Unit 1 Slides',
            type: 'slides',
            description: 'Introduction to digital logic.',
            driveUrl: 'https://drive.google.com/file/d/example-dl-slides-1/view',
          },
          {
            title: 'Previous Year Questions 2023',
            type: 'pyqs',
            description: 'End-semester exam paper with key topics.',
            driveUrl: 'https://drive.google.com/file/d/example-dl-pyq-1/view',
          },
        ],
      },
      { name: 'Physics of Materials', code: 'PHY301' },
      { name: 'Mathematics', code: 'MATH301' },
      { name: 'OOPS and Design', code: 'CS302' },
      { name: 'Discrete Structures', code: 'CS303' },
    ],
  },
];

async function seed() {
  await connectDB();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fragy.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
  const adminName = process.env.ADMIN_NAME || 'Fragy Admin';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
    });
    console.log(`✓ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    admin.role = 'admin';
    admin.name = adminName;
    admin.passwordHash = await bcrypt.hash(adminPassword, 12);
    await admin.save();
    console.log(`✓ Admin updated: ${adminEmail} / ${adminPassword}`);
  }

  for (const sem of SAMPLE) {
    let semester = await Semester.findOne({ number: sem.number });
    if (!semester) {
      semester = await Semester.create({
        name: sem.name,
        number: sem.number,
        description: sem.description,
      });
      console.log(`✓ Semester ${sem.number} created`);
    } else {
      semester.name = sem.name;
      semester.description = sem.description;
      await semester.save();
    }

    if (RESET_SUBJECTS) {
      const oldSubjects = await Subject.find({ semesterId: semester._id });
      const oldIds = oldSubjects.map((s) => s._id);
      if (oldIds.length) {
        await Resource.deleteMany({ subjectId: { $in: oldIds } });
        await Subject.deleteMany({ _id: { $in: oldIds } });
        console.log(`  ↺ Cleared old subjects for semester ${sem.number}`);
      }
    }

    for (const sub of sem.subjects) {
      let subject = await Subject.findOne({ semesterId: semester._id, code: sub.code });
      if (!subject) {
        subject = await Subject.create({
          name: sub.name,
          code: sub.code,
          semesterId: semester._id,
        });
        console.log(`  ✓ Subject ${sub.code} — ${sub.name}`);
      } else {
        subject.name = sub.name;
        await subject.save();
        console.log(`  ✓ Subject updated ${sub.code} — ${sub.name}`);
      }

      if (sub.resources?.length) {
        for (const res of sub.resources) {
          const exists = await Resource.findOne({
            subjectId: subject._id,
            title: res.title,
            type: res.type,
          });
          if (!exists) {
            await Resource.create({ ...res, subjectId: subject._id });
            console.log(`    ✓ Resource ${res.title}`);
          }
        }
      }
    }
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
