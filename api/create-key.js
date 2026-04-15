const { connectToDatabase } = require('../lib/mongodb');
const { authMiddleware } = require('../lib/auth');
const { generateLicenseKey } = require('../lib/utils');
const { errorResponse, successResponse } = require('../lib/utils');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const auth = authMiddleware(req);
  if (!auth.authenticated) {
    return res.status(401).json(
      JSON.parse(errorResponse(401, auth.error).body)
    );
  }

  try {
    const { db } = await connectToDatabase();
    let key;
    let keyExists = true;

    // Generate unique key
    while (keyExists) {
      key = generateLicenseKey();
      const existingKey = await db.collection('keys').findOne({ key });
      keyExists = !!existingKey;
    }

    // Insert key into database
    const result = await db.collection('keys').insertOne({
      key,
      deviceId: null,
      createdAt: new Date(),
    });

    return res.status(201).json(
      JSON.parse(
        successResponse({
          _id: result.insertedId,
          key,
          deviceId: null,
          createdAt: new Date().toISOString(),
        })
      )
    );
  } catch (error) {
    console.error('Create key error:', error);
    return res.status(500).json(
      JSON.parse(errorResponse(500, 'Internal server error').body)
    );
  }
};
