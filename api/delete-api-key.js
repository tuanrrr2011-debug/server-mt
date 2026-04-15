const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../lib/mongodb');
const { authMiddleware } = require('../lib/auth');
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
    const { keyId } = req.body;

    if (!keyId) {
      return res.status(400).json(
        JSON.parse(errorResponse(400, 'Key ID is required').body)
      );
    }

    const { db } = await connectToDatabase();
    const result = await db.collection('apiKeys').deleteOne({
      _id: new ObjectId(keyId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json(
        JSON.parse(errorResponse(404, 'API key not found').body)
      );
    }

    return res.status(200).json(
      JSON.parse(successResponse({ message: 'API key deleted successfully' }))
    );
  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json(
      JSON.parse(errorResponse(500, 'Internal server error').body)
    );
  }
};
