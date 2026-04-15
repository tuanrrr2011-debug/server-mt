const { connectToDatabase } = require('../lib/mongodb');
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
    const { key, deviceId } = req.body;

    // Validate input
    if (!key || !deviceId) {
      return res.status(400).json(
        JSON.parse(errorResponse(400, 'Key and deviceId are required').body)
      );
    }

    const { db } = await connectToDatabase();
    const licenseKey = await db.collection('keys').findOne({ key });

    if (!licenseKey) {
      return res.status(200).json(
        JSON.parse(successResponse({ status: 'invalid', message: 'License key not found' }))
      );
    }

    // Key found but not yet bound to any device
    if (!licenseKey.deviceId) {
      // Bind device to this key
      await db.collection('keys').updateOne(
        { key },
        { $set: { deviceId, boundAt: new Date() } }
      );

      return res.status(200).json(
        JSON.parse(
          successResponse({
            status: 'valid',
            message: 'License key activated',
            deviceId,
          })
        )
      );
    }

    // Key is already bound
    if (licenseKey.deviceId === deviceId) {
      // Same device
      return res.status(200).json(
        JSON.parse(
          successResponse({
            status: 'valid',
            message: 'License key is valid',
          })
        )
      );
    }

    // Different device - key is already in use
    return res.status(200).json(
      JSON.parse(
        successResponse({
          status: 'used',
          message: 'License key is already used on another device',
        })
      )
    );
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json(
      JSON.parse(errorResponse(500, 'Internal server error').body)
    );
  }
};
