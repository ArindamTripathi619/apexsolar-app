// Simple authentication checker for production
// Run this in browser console on the production site

console.log('=== Authentication Debug Info ===');
console.log('Current URL:', window.location.href);
console.log('Domain:', window.location.hostname);

// Check cookies
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [name, value] = cookie.trim().split('=');
  acc[name] = value;
  return acc;
}, {});

console.log('All cookies:', cookies);
console.log('Auth token present:', !!cookies['auth-token']);
console.log('Auth token preview:', cookies['auth-token'] ? cookies['auth-token'].substring(0, 50) + '...' : 'NOT FOUND');

// Test API call
console.log('\n=== Testing API Authentication ===');
fetch('/api/company-settings', {
  method: 'GET',
  credentials: 'include'
})
.then(response => {
  console.log('GET API Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('GET API Response:', data);
  
  // Test PUT if GET works
  if (data.success) {
    console.log('GET worked, testing PUT...');
    return fetch('/api/company-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        accountName: "APEX SOLAR",
        bankName: "STATE BANK OF INDIA", 
        ifscCode: "SBIN0007679",
        accountNumber: "40423372674",
        gstNumber: "19AFZPT2526E1ZV"
      })
    });
  }
})
.then(response => response ? response.json() : null)
.then(data => {
  if (data) {
    console.log('PUT API Status:', data.success ? 'SUCCESS' : 'FAILED');
    console.log('PUT API Response:', data);
  }
})
.catch(error => {
  console.error('API Test Error:', error);
});

console.log('\n=== Instructions ===');
console.log('1. If auth-token is missing → Login again');
console.log('2. If auth-token exists but API fails → Check server logs');
console.log('3. If both fail → Clear cookies and login again');
