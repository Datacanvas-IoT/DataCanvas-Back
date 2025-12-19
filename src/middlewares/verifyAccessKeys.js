const AccessKey = require('../models/accessKeyModel');

module.exports = async function verifyAccessKeys(req, res, next) {
    const { project_id, access_keys } = req.body;
    if (!project_id || !Array.isArray(access_keys) || access_keys.length === 0) {
        return res.status(400).json({ success: false, message: 'project_id and access_keys array are required' });
    }

    const verifiedKeys = [];
    const expiredKeys = [];

    for (const pair of access_keys) {
        const { client_access_key, secret_access_key } = pair;
        if (!client_access_key || !secret_access_key) continue;

        const found = await AccessKey.findOne({
            where: { project_id, client_access_key, secret_access_key }
        });

        if (!found) continue;

        if (found.expiration_date && new Date(found.expiration_date) < new Date()) {
            expiredKeys.push({ client_access_key, secret_access_key });
            continue;
        }

        verifiedKeys.push(found);
    }

    if (expiredKeys.length > 0 && verifiedKeys.length === 0) {
        return res.status(403).json({ success: false, message: 'All provided access keys are expired', expiredKeys });
    }

    if (verifiedKeys.length === 0) {
        return res.status(403).json({ success: false, message: 'No valid access keys found' });
    }

    req.verifiedAccessKeys = verifiedKeys;
    next();
};
