#!/usr/bin/env node

// Debug script for company settings API
// Usage: node debug-company-settings.js [production-url] [auth-token]

const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const baseUrl = args[0] || 'http://localhost:3001';
const authToken = args[1];

console.log('Debugging Company Settings API');
console.log('Base URL:', baseUrl);
console.log('Auth Token:', authToken ? 'Provided' : 'Not provided');

// Test data
const testData = {
  accountName: "APEX SOLAR",
  bankName: "STATE BANK OF INDIA",
  ifscCode: "SBIN0007679",
  accountNumber: "40423372674",
  gstNumber: "19AFZPT2526E1ZV",
  stampSignatureUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  companyLogoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
};

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCompanySettings() {
  try {
    console.log('\n=== Testing GET /api/company-settings ===');
    
    // Test GET request
    const getResponse = await makeRequest(`${baseUrl}/api/company-settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Cookie': `auth-token=${authToken}` })
      }
    });
    
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response Data:', JSON.stringify(getResponse.data, null, 2));
    
    console.log('\n=== Testing PUT /api/company-settings ===');
    
    // Test PUT request
    const putResponse = await makeRequest(`${baseUrl}/api/company-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Cookie': `auth-token=${authToken}` })
      }
    }, testData);
    
    console.log('PUT Response Status:', putResponse.status);
    console.log('PUT Response Data:', JSON.stringify(putResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing company settings:', error.message);
  }
}

// Run the test
testCompanySettings();
