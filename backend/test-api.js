// Simple test script to verify the courses API
const mongoose = require('mongoose');
const UserSchedule = require('./models/UserSchedule');

// Test data
const testUserId = new mongoose.Types.ObjectId();
const testCourses = [
  {
    id: 'course-1',
    courseCode: 'CSC 101',
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '09:00',
    endTime: '09:50',
    location: 'Room 123'
  },
  {
    id: 'course-2', 
    courseCode: 'MATH 201',
    days: ['Tue', 'Thu'],
    startTime: '10:00',
    endTime: '11:30',
    location: 'Room 456'
  }
];

async function testAPI() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/hackrice', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Test 1: Create a user schedule
    console.log('\n=== Test 1: Create User Schedule ===');
    const userSchedule = await UserSchedule.findOneAndUpdate(
      { user_id: testUserId },
      { 
        user_id: testUserId,
        courses: testCourses,
        updatedAt: Date.now()
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );
    
    console.log('Created/Updated schedule:', {
      id: userSchedule._id,
      user_id: userSchedule.user_id,
      courseCount: userSchedule.courses.length
    });

    // Test 2: Fetch the user schedule
    console.log('\n=== Test 2: Fetch User Schedule ===');
    const fetchedSchedule = await UserSchedule.findOne({ user_id: testUserId });
    
    if (fetchedSchedule) {
      console.log('Fetched schedule:', {
        id: fetchedSchedule._id,
        user_id: fetchedSchedule.user_id,
        courses: fetchedSchedule.courses
      });
    } else {
      console.log('No schedule found for user');
    }

    // Test 3: Update a specific course
    console.log('\n=== Test 3: Update Specific Course ===');
    const courseToUpdate = fetchedSchedule.courses.find(c => c.id === 'course-1');
    if (courseToUpdate) {
      courseToUpdate.location = 'Updated Room 789';
      fetchedSchedule.updatedAt = Date.now();
      await fetchedSchedule.save();
      console.log('Updated course location:', courseToUpdate);
    }

    // Test 4: Clean up
    console.log('\n=== Test 4: Cleanup ===');
    await UserSchedule.findOneAndDelete({ user_id: testUserId });
    console.log('Test data cleaned up');

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testAPI();