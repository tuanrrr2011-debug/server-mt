const { connectToDatabase } = require('../lib/mongodb');
const { authMiddleware } = require('../lib/auth');
const { errorResponse, successResponse } = require('../lib/utils');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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
    const keys = await db
      .collection('keys')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(
      JSON.parse(
        successResponse(
          keys.map((k) => ({
            _id: k._id.toString(),
            key: k.key,
            deviceId: k.deviceId || null,
            status: k.deviceId ? 'bound' : 'available',
            createdAt: k.createdAt.toISOString(),
            boundAt: k.boundAt ? k.boundAt.toISOString() : null,
          }))
        )
      )
    );
  } catch (error) {
    console.error('List keys error:', error);
    return res.status(500).json(
      JSON.parse(errorResponse(500, 'Internal server error').body)
    );
  }
};
