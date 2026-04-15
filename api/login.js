const { connectToDatabase } = require('../lib/mongodb');
const { comparePassword, generateToken } = require('../lib/auth');
const { errorResponse, successResponse } = require('../lib/utils');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json(
        JSON.parse(errorResponse(400, 'Username and password are required').body)
      );
    }

    const { db } = await connectToDatabase();
    const admin = await db.collection('admins').findOne({ username });

    if (!admin) {
      return res.status(401).json(
        JSON.parse(errorResponse(401, 'Invalid credentials').body)
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json(
        JSON.parse(errorResponse(401, 'Invalid credentials').body)
      );
    }

    // Generate JWT token
    const token = generateToken({ userId: admin._id, username: admin.username });

    return res.status(200).json(
      JSON.parse(
        successResponse({ token, username: admin.username })
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(
      JSON.parse(errorResponse(500, 'Internal server error').body)
    );
  }
};
