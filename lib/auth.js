const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
function generateToken(data) {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Compare password
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function authMiddleware(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }

  return { authenticated: true, user: decoded };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
};
