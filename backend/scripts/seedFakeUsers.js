require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Fake user data generator
const generateFakeUsers = () => {
  const firstNames = ['Alex', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Ryan', 'Ashley', 'Tyler', 'Samantha'];
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'];
  const majors = ['Computer Science', 'Electrical Engineering', 'Business Administration', 'Mechanical Engineering', 'Biology', 'Psychology', 'Mathematics', 'Information Technology', 'Accounting', 'Marketing'];
  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
  const bios = [
    'Love coding and building innovative solutions',
    'Passionate about technology and entrepreneurship',
    'Always looking for study partners and new friends',
    'Interested in machine learning and AI',
    'Enjoys hackathons and programming competitions',
    'Looking to connect with fellow students',
    'Excited about software development and design',
    'Interested in data science and analytics',
    'Love working on group projects',
    'Always eager to learn new technologies'
  ];

  const users = [];
  
  for (let i = 0; i < 10; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const netId = `${firstName.toLowerCase().substring(0, 3)}${lastName.toLowerCase().substring(0, 2)}${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    const email = `${netId}@utdallas.edu`;
    
    users.push({
      name: `${firstName} ${lastName}`,
      email: email,
      university: "University of Texas at Dallas",
      age: Math.floor(Math.random() * 6) + 18, // Ages 18-23
      profileCompleted: true,
      year: years[Math.floor(Math.random() * years.length)],
      major: majors[i],
      bio: bios[i],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random date within last 30 days
    });
  }
  
  return users;
};

// Seed the database
const seedUsers = async () => {
  try {
    // Clear existing fake users (optional - remove this if you want to keep existing data)
    console.log('Clearing existing test users...');
    await User.deleteMany({ email: { $regex: /@utdallas\.edu$/ } });
    
    // Generate and insert fake users
    const fakeUsers = generateFakeUsers();
    console.log('Inserting fake users...');
    
    const insertedUsers = await User.insertMany(fakeUsers);
    
    console.log(`Successfully inserted ${insertedUsers.length} fake users:`);
    insertedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.major}, ${user.year}`);
    });
    
    console.log('\nFake users have been added to the database!');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the seeding script
seedUsers();