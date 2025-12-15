const crypto = require('crypto');
const AccessKey = require('../models/accessKeyModel');
const AccessKeyDevice = require('../models/accessKeyDeviceModel');
const AccessKeyDomain = require('../models/accessKeyDomainModel');
const Project = require('../models/projectModel');
const Device = require('../models/deviceModel');
const sequelize = require('../../db');
const { createAccessKeyPair, calculateExpirationDate, hashAccessKeyPair } = require('../utils/accessKeyUtils');


async function getAllAccessKeysByProjectId(req, res) {
  try {
    const userId = req.user.id || req.user.user_id;
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: project_id',
      });
    }

    // Validate project_id is a valid number
    const parsedProjectId = parseInt(project_id, 10);
    if (isNaN(parsedProjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project_id: must be a number',
      });
    }

    // Verify the project exists and belongs to the user
    const project = await Project.findByPk(parsedProjectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    if (project.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this project',
      });
    }

    // Find all access keys for the project
    const accessKeys = await AccessKey.findAll({
      where: { project_id: parsedProjectId },
      attributes: [
        'access_key_id',
        'access_key_name',
      ],
    });

    return res.status(200).json({
      success: true,
      count: accessKeys.length,
      access_keys: accessKeys,
    });
  } catch (error) {
    console.error('Error getting access keys by project_id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get access keys',
    });
  }
}

async function createAccessKey(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { project_id, domain_name_array, device_id_array, valid_duration_for_access_key, access_key_name } = req.body;
    const userId = req.user.id || req.user.user_id;

    if (!project_id || !access_key_name || !domain_name_array || !device_id_array || !valid_duration_for_access_key) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, access_key_name, domain_name_array, device_id_array, valid_duration_for_access_key',
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
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this project',
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
      access_key_id: accessKey.access_key_id,
      access_key_name: accessKey.access_key_name,
      client_access_key: client,
      secret_access_key: secret,
      expiration_date: expirationDate,
      accessible_domains: domain_name_array,
      accessible_devices: device_id_array,
      note: 'Store the client_access_key and secret_access_key securely. They will not be displayed again.',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating access key:', error);
    return res.status(500).json({
      error: 'Failed to create access key',
    });
  }
}

async function deleteAccessKey(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { access_key_id } = req.params;
    const userId = req.user.id || req.user.user_id;

    // Validate access_key_id
    const parsedAccessKeyId = parseInt(access_key_id, 10);
    if (isNaN(parsedAccessKeyId)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid access_key_id: must be a number',
      });
    }

    // Find the access key with its project
    const accessKey = await AccessKey.findByPk(parsedAccessKeyId, {
      include: [{
        model: Project,
        as: 'project',
      }],
      transaction,
    });

    if (!accessKey) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Access key not found',
      });
    }

    // Verify ownership
    if (accessKey.project.user_id !== userId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this access key',
      });
    }

    await accessKey.destroy({ transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Access key deleted successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting access key:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete access key',
    });
  }
}


module.exports = {
  createAccessKey,
  getAllAccessKeysByProjectId,
  deleteAccessKey,
};
