/**
 * @typedef {import('./scheduleParser').ParsedClassData} ClassData
 */

/**
 * @typedef {object} MockUser
 * @property {string} id - Unique ID for the user.
 * @property {string} name - User's name.
 * @property {string} major - User's major.
 * @property {string} year - User's academic year.
 * @property {ClassData[]} schedule - Array of class objects for the user.
 */

/**
 * Mock data for other students to be used in the Matcher page.
 * @type {MockUser[]}
 */
export const mockUsers = [
  {
    id: 'mock1',
    name: 'Alice Smith',
    major: 'Computer Science',
    year: 'Junior',
    schedule: [
      { id: 'c101', course: 'CSC 101', days: ['Mon', 'Wed'], startTime: '09:00', endTime: '09:50', location: 'LGRC A203' },
      { id: 'm201', course: 'MTH 201', days: ['Tue', 'Thu'], startTime: '10:00', endTime: '11:15', location: 'HASB 132' },
      { id: 'eng101', course: 'ENG 101', days: ['Mon', 'Wed', 'Fri'], startTime: '11:00', endTime: '11:50', location: 'HUM 014' },
    ],
  },
  {
    id: 'mock2',
    name: 'Bob Johnson',
    major: 'Electrical Engineering',
    year: 'Sophomore',
    schedule: [
      { id: 'phy101', course: 'PHY 101', days: ['Mon', 'Wed'], startTime: '10:00', endTime: '10:50', location: 'ISB 145' },
      { id: 'csc101', course: 'CSC 101', days: ['Tue', 'Thu'], startTime: '13:00', endTime: '14:15', location: 'ELAB 211' },
      { id: 'math235', course: 'MTH 235', days: ['Tue', 'Thu'], startTime: '14:30', endTime: '15:45', location: 'LGRC A305' },
    ],
  },
  {
    id: 'mock3',
    name: 'Charlie Brown',
    major: 'Computer Science',
    year: 'Freshman',
    schedule: [
      { id: 'csc101', course: 'CSC 101', days: ['Mon', 'Wed'], startTime: '09:00', endTime: '09:50', location: 'LGRC A203' },
      { id: 'wr110', course: 'WRIT 110', days: ['Tue', 'Thu'], startTime: '11:30', endTime: '12:45', location: 'FIN 102' },
    ],
  },
  {
    id: 'mock4',
    name: 'Diana Prince',
    major: 'Physics',
    year: 'Junior',
    schedule: [
      { id: 'phy101', course: 'PHY 101', days: ['Mon', 'Wed'], startTime: '10:00', endTime: '10:50', location: 'ISB 145' },
      { id: 'mth201', course: 'MTH 201', days: ['Tue', 'Thu'], startTime: '10:00', endTime: '11:15', location: 'HASB 132' },
    ],
  },
  {
    id: 'mock5',
    name: 'Eve Adams',
    major: 'Biology',
    year: 'Senior',
    schedule: [
      { id: 'bio101', course: 'BIO 101', days: ['Mon', 'Wed', 'Fri'], startTime: '09:00', endTime: '09:50', location: 'MOR 105' },
      { id: 'chm111', course: 'CHM 111', days: ['Tue', 'Thu'], startTime: '13:00', endTime: '14:15', location: 'LGRT 010' },
    ],
  },
];
