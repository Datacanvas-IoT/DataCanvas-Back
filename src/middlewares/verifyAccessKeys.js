const AccessKey = require("../models/accessKeyModel");
const { hashAccessKeyPair } = require('../utils/accessKeyUtils');

module.exports = async function verifyAccessKeys(req, res, next) {
  const { project_id, access_key_client, access_key_secret } = req.body;

  if (!project_id || !access_key_client || !access_key_secret) {
    return res.status(400).json({
      success: false,
      message: 'project_id, access_key_client, and access_key_secret are required',
    });
  }

  try {
    const hashedClient = hashAccessKeyPair(access_key_client);
    const hashedSecret = hashAccessKeyPair(access_key_secret);

    const foundAccessKey = await AccessKey.findOne({
      where: {
        project_id,
        client_access_key: hashedClient,
        secret_access_key: hashedSecret,
      },
    });

    if (!foundAccessKey) {
      return res.status(403).json({ success: false, message: 'Invalid access key pair provided' });
    }

    if (foundAccessKey.expiration_date && new Date(foundAccessKey.expiration_date) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Provided access key pair is expired. Either renew or create a new one.',
      });
    }

    req.verifiedAccessKeys = foundAccessKey;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify access keys' });
  }
};
