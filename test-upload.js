// Test script to debug file upload issue
const fs = require('fs');
const path = require('path');

// Function to convert file to base64 (like FileReader does)
function fileToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = `data:image/${path.extname(filePath).slice(1)};base64,${fileBuffer.toString('base64')}`;
    
    console.log('File info:');
    console.log('- File size:', fileBuffer.length, 'bytes');
    console.log('- Base64 size:', base64.length, 'characters');
    console.log('- File type:', path.extname(filePath));
    console.log('- Base64 preview:', base64.substring(0, 100) + '...');
    
    return base64;
  } catch (error) {
    console.error('Error reading file:', error.message);
    return null;
  }
}

// Test with a small sample image
console.log('Testing file upload simulation...');

// You can put a test image path here
const testImagePath = './test-image.png'; // Replace with your actual image path

if (fs.existsSync(testImagePath)) {
  const base64 = fileToBase64(testImagePath);
  if (base64) {
    console.log('\nFile successfully converted to base64');
    console.log('This would be sent to the API');
  }
} else {
  console.log('Test image not found. Please put a test image at:', testImagePath);
  console.log('Or update the testImagePath variable in this script');
}
