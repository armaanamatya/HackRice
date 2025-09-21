// Test script for users API endpoints
const fetch = require('node-fetch'); // You might need to install this: npm install node-fetch

const API_BASE = 'http://localhost:5000/api/users'; // Adjust port if needed

async function testUsersAPI() {
  console.log('🧪 Testing Users API Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test 2: Get all users
    console.log('2. Testing get all users...');
    const usersResponse = await fetch(`${API_BASE}`);
    const usersData = await usersResponse.json();
    console.log(`✅ Found ${usersData.length} users in database`);
    if (usersData.length > 0) {
      console.log('First user example:', {
        name: usersData[0].name,
        university: usersData[0].university,
        email: usersData[0].email?.substring(0, 5) + '...' // Partial email for privacy
      });
    }
    console.log('');

    // Test 3: Search functionality
    console.log('3. Testing search functionality...');
    
    if (usersData.length > 0) {
      // Search by first user's name
      const searchName = usersData[0].name || 'test';
      console.log(`Searching for users with name containing: "${searchName}"`);
      
      const searchResponse = await fetch(`${API_BASE}/search?name=${encodeURIComponent(searchName)}`);
      const searchData = await searchResponse.json();
      
      if (searchResponse.ok) {
        console.log(`✅ Search successful: Found ${searchData.length} users`);
        searchData.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.university})`);
        });
      } else {
        console.log('❌ Search failed:', searchData);
      }
    } else {
      console.log('⚠️ No users in database to test search with');
    }
    console.log('');

    // Test 4: Search with university filter
    console.log('4. Testing search with university filter...');
    const universitySearchResponse = await fetch(`${API_BASE}/search?name=a&university=Rice University`);
    const universitySearchData = await universitySearchResponse.json();
    
    if (universitySearchResponse.ok) {
      console.log(`✅ University search successful: Found ${universitySearchData.length} Rice University users with 'a' in name`);
    } else {
      console.log('❌ University search failed:', universitySearchData);
    }
    console.log('');

    // Test 5: Invalid search (no name)
    console.log('5. Testing invalid search (no name parameter)...');
    const invalidSearchResponse = await fetch(`${API_BASE}/search`);
    const invalidSearchData = await invalidSearchResponse.json();
    
    if (invalidSearchResponse.status === 400) {
      console.log('✅ Correctly rejected search without name:', invalidSearchData.message);
    } else {
      console.log('❌ Should have rejected search without name');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure your backend server is running on the correct port!');
  }
}

// Run the test
testUsersAPI();