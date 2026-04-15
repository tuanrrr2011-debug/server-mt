const crypto = require('crypto');

// Generate License Key format: XXXX-XXXX-XXXX
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = '';

  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    key += segment;
    if (i < 2) key += '-';
  }

  return key;
}

// Generate API Key format: sk_live_xxxxxxxxxxxxxxxx
function generateApiKey() {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `sk_live_${randomBytes}`;
}

// Response helper
function response(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(data),
  };
}

// Error response
function errorResponse(statusCode, message) {
  return response(statusCode, { success: false, error: message });
}

// Success response
function successResponse(data) {
  return response(200, { success: true, data });
}

module.exports = {
  generateLicenseKey,
  generateApiKey,
  response,
  errorResponse,
  successResponse,
};
