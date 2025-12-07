const crypto = require('crypto');
const AccessKey = require('../models/accessKeyModel');
const AccessKeyDevice = require('../models/accessKeyDeviceModel');
const AccessKeyDomain = require('../models/accessKeyDomainModel');
const Project = require('../models/projectModel');
const Device = require('../models/deviceModel');
const sequelize = require('../../db');


async function createAccessKey(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { project_id, domain_name_array, device_id_array, valid_duration_for_access_key, access_key_name } = req.body;
    const userId = req.user.id || req.user.user_id; 

    if (!project_id || !domain_name_array || !device_id_array || !valid_duration_for_access_key) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, domain_name_array, device_id_array, valid_duration_for_access_key',
      });
    }

    if (!Array.isArray(domain_name_array) || !Array.isArray(device_id_array)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'domain_name_array and device_id_array must be arrays',
      });
    }

    const project = await Project.findByPk(project_id, { transaction });
    if (!project) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.user_id !== userId) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: You do not own this project',
      });
    }
    const devices = await Device.findAll({
      where: {
        device_id: device_id_array,
        project_id: project_id,
      },
      transaction,
    });

    if (devices.length !== device_id_array.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'One or more devices not found or do not belong to this project',
      });
    }

    const { client, secret } = createAccessKeyPair();

    const hashedClient = hashAccessKeyPair(client);
    const hashedSecret = hashAccessKeyPair(secret);

    const expirationDate = calculateExpirationDate(valid_duration_for_access_key);

    const accessKey = await AccessKey.create(
      {
        access_key_name: access_key_name || `AccessKey_${Date.now()}`,
        project_id,
        client_access_key: hashedClient,
        secret_access_key: hashedSecret,
        expiration_date: expirationDate,
        access_key_last_use_time: null,
      },
      { transaction }
    );

    const domainRecords = domain_name_array.map((domain) => ({
      access_key_domain_name: domain,
      access_key_id: accessKey.access_key_id,
    }));
    await AccessKeyDomain.bulkCreate(domainRecords, { transaction });

    const deviceRecords = device_id_array.map((device_id) => ({
      device_id,
      access_key_id: accessKey.access_key_id,
    }));
    await AccessKeyDevice.bulkCreate(deviceRecords, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Access key created successfully',
      data: {
        access_key_id: accessKey.access_key_id,
        access_key_name: accessKey.access_key_name,
        client_access_key: client, 
        secret_access_key: secret,
        expiration_date: expirationDate,
        accessible_domains: domain_name_array,
        accessible_devices: device_id_array,
      },
      note: 'Store the client_access_key and secret_access_key securely. They will not be displayed again.',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating access key:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating access key',
      error: error.message,
    });
  }
}

function createAccessKeyPair() {
  const client = crypto.randomBytes(24).toString('hex');
  const secret = crypto.randomBytes(24).toString('hex');
  return { client, secret };
}

function calculateExpirationDate(validDurationDays) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + validDurationDays);
  return expirationDate;
}

/**
 * Hash access key pair using SHA-256
 */
function hashAccessKeyPair(keyPair) {
  return crypto.createHash('sha256').update(keyPair).digest('hex');
}

module.exports = {
  createAccessKey,
};
