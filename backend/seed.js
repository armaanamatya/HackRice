const mongoose = require('mongoose');
const User = require('./models/User');
const { faker } = require('@faker-js/faker');

// Connect to MongoDB (ensure your MongoDB URI is correct)
mongoose.connect('mongodb://localhost:27017/hackrice', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding...'))
.catch(err => console.error(err));

const universities = [
  'Rice University',
  'University of Houston',
  'University of Texas at Dallas',
];

const academicYears = [
  'Freshman',
  'Sophomore',
  'Junior',
  'Senior',
  'Graduate',
];

const majors = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Economics',
  'Business Administration',
  'History',
  'English',
];

const generateFakeSchedule = () => {
  const numClasses = faker.number.int({ min: 2, max: 5 });
  const schedule = [];

  for (let i = 0; i < numClasses; i++) {
    const courseName = faker.helpers.arrayElement([
      'Calculus I', 'Linear Algebra', 'Data Structures', 'Algorithms',
      'Operating Systems', 'Thermodynamics', 'Organic Chemistry',
      'Introduction to Biology', 'Microeconomics', 'Macroeconomics',
      'World History', 'American Literature', 'Differential Equations',
    ]);
    const courseCode = faker.string.alphanumeric(4).toUpperCase() + faker.number.int({ min: 100, max: 499 });
    const days = faker.helpers.arrayElements(['M', 'Tu', 'W', 'Th', 'F'], { min: 1, max: 3 });
    const startTimeHour = faker.number.int({ min: 8, max: 17 }); // 8 AM to 5 PM
    const startTimeMinute = faker.helpers.arrayElement([0, 15, 30, 45]);
    const startTime = `${String(startTimeHour).padStart(2, '0')}:${String(startTimeMinute).padStart(2, '0')}`;

    const endTimeHour = startTimeHour + faker.number.int({ min: 1, max: 2 });
    const endTimeMinute = faker.helpers.arrayElement([0, 15, 30, 45]);
    const endTime = `${String(endTimeHour).padStart(2, '0')}:${String(endTimeMinute).padStart(2, '0')}`;

    schedule.push({
      course: `${courseCode}: ${courseName}`,
      days,
      startTime,
      endTime,
      location: faker.location.buildingNumber(),
      instructor: faker.person.fullName(),
    });
  }
  return schedule;
};

const seedDB = async () => {
  await User.deleteMany({}); // Clear existing data
  console.log('Cleared existing users.');

  const numUsers = 50; // Number of dummy users to create
  const users = [];

  for (let i = 0; i < numUsers; i++) {
    const name = faker.person.fullName();
    const university = faker.helpers.arrayElement(universities);
    const email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1], provider: university.toLowerCase().replace(/ /g, '').replace(/university/g, '') + '.edu' });
    const age = faker.number.int({ min: 18, max: 30 });
    const year = faker.helpers.arrayElement(academicYears);
    const major = faker.helpers.arrayElement(majors);
    const bio = faker.person.bio();
    const profileCompleted = faker.datatype.boolean({ probability: 0.9 }); // Most profiles are completed
    const schedule = profileCompleted ? generateFakeSchedule() : [];

    users.push({
      name,
      email,
      university,
      age,
      year,
      major,
      bio,
      profileCompleted,
      schedule, // Add the generated schedule
    });
  }

  await User.insertMany(users);
  console.log(`Successfully seeded ${numUsers} users.`);
};

seedDB().then(() => {
  mongoose.connection.close();
  console.log('MongoDB connection closed.');
});
