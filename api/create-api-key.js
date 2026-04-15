const { connectToDatabase } = require('../lib/mongodb');
const { authMiddleware } = require('../lib/auth');
const { generateApiKey } = require('../lib/utils');
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
    const { name } = req.body;

    if (!name) {
      return res.status(400).json(
        JSON.parse(errorResponse(400, 'API key name is required').body)
      );
    }

    const { db } = await connectToDatabase();
    const apiKey = generateApiKey();

    const result = await db.collection('apiKeys').insertOne({
      name,
      apiKey,
      createdAt: new Date(),
    });

    return res.status(201).json(
      JSON.parse(
        successResponse({
          _id: result.insertedId,
          name,
          apiKey,
          createdAt: new Date().toISOString(),
        })
      )
    );
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json(
      JSON.parse(errorResponse(500, 'Internal server error').body)
    );
  }
};
