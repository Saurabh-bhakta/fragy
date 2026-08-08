/**
 * Temporary mock data for early frontend stages.
 * Live data comes from the Express API when the server is running.
 */

export const semesters = [
  {
    id: 1,
    number: 1,
    name: 'Semester 1',
    description: 'Foundational first-year courses.',
    subjectCount: 7,
  },
  {
    id: 2,
    number: 2,
    name: 'Semester 2',
    description: 'Core second-semester science and engineering subjects.',
    subjectCount: 5,
  },
  {
    id: 3,
    number: 3,
    name: 'Semester 3',
    description: 'Core computing and mathematics subjects.',
    subjectCount: 5,
  },
];

/** Subjects grouped by semester number */
export const subjectsBySemester = {
  1: [
    { id: 's1-computing', name: 'Introduction to Computing', code: 'CS101' },
    { id: 's1-math', name: 'Mathematics', code: 'MATH101' },
    { id: 's1-english', name: 'English', code: 'HS101' },
    { id: 's1-happiness', name: 'Happiness', code: 'HS102' },
    { id: 's1-chemistry', name: 'Chemistry', code: 'CHY101' },
    { id: 's1-workshop', name: 'Workshop', code: 'WS101' },
    { id: 's1-electronics', name: 'Basic Electronics', code: 'EC101' },
  ],
  2: [
    { id: 's2-physics', name: 'Physics', code: 'PHY201' },
    { id: 's2-math', name: 'Mathematics', code: 'MATH201' },
    { id: 's2-dsa', name: 'DSA', code: 'CS201' },
    { id: 's2-electrical', name: 'Basic Electrical', code: 'EE201' },
    { id: 's2-env', name: 'Energy Environment And Climate Change', code: 'ES201' },
  ],
  3: [
    { id: 's3-digital', name: 'Digital Logic', code: 'CS301' },
    { id: 's3-pom', name: 'Physics of Materials', code: 'PHY301' },
    { id: 's3-math', name: 'Mathematics', code: 'MATH301' },
    { id: 's3-oops', name: 'OOPS and Design', code: 'CS302' },
    { id: 's3-discrete', name: 'Discrete Structures', code: 'CS303' },
  ],
};

/**
 * Sample resources per subject.
 * driveUrl values are placeholders — real links will live in the database later.
 */
export const resourcesBySubject = {
  's3-digital': {
    notes: [
      {
        id: 'dl-n1',
        title: 'Unit 1 Notes',
        description: 'Number systems and boolean algebra overview.',
        driveUrl: 'https://drive.google.com/file/d/example-dl-notes-1',
      },
    ],
    slides: [
      {
        id: 'dl-s1',
        title: 'Unit 1 Slides',
        description: 'Introduction to digital logic.',
        driveUrl: 'https://drive.google.com/file/d/example-dl-slides-1',
      },
    ],
    pyqs: [
      {
        id: 'dl-p1',
        title: 'Previous Year Questions 2023',
        description: 'End-semester exam paper with key topics.',
        driveUrl: 'https://drive.google.com/file/d/example-dl-pyq-1',
      },
    ],
  },
};

/** Fallback empty resource groups when a subject has no mock data yet */
export const emptyResources = { notes: [], slides: [], pyqs: [] };

export function getSemesterById(semesterId) {
  const id = Number(semesterId);
  return semesters.find((s) => s.number === id || s.id === id);
}

export function getSubjectsForSemester(semesterId) {
  return subjectsBySemester[Number(semesterId)] || [];
}

export function getSubjectById(semesterId, subjectId) {
  const subjects = getSubjectsForSemester(semesterId);
  return subjects.find((s) => s.id === subjectId);
}

export function getResourcesForSubject(subjectId) {
  return resourcesBySubject[subjectId] || emptyResources;
}
