const fetch = require('node-fetch');

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test if backend is running
    const response = await fetch('http://localhost:4100/api/memberships/plans');
    const data = await response.json();
    
    console.log('Backend is running!');
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Backend connection failed:', error.message);
    console.log('Please make sure the backend server is running on port 4100');
  }
}

testBackend(); 