// External: Get all devices for verified access keys
async function getAllDevicesForExternal(req, res) {
  const project_id = req.body.project_id;
  try {
    const devices = await Device.findAll({
      where: { project_id },
      attributes: ['device_id', 'device_name']
    });
    return res.status(200).json({ success: true, devices });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
}

// External: Get all data for a datatable for verified access keys
async function getAllDataForExternal(req, res) {
  const DataTable = require('../models/dataTableModel');
  const { getAllDataOfATable } = require('./dataSendingController');
  const { project_id, datatable_name, offset = 0, limit = 100 } = req.body;
  if (!datatable_name) {
    return res.status(400).json({ success: false, message: 'datatable_name is required' });
  }
  try {
    const table = await DataTable.findOne({ where: { tbl_name: datatable_name, project_id } });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Datatable not found for this project' });
    }
    req.query.tbl_id = table.tbl_id;
    req.query.offset = offset;
    req.query.limit = limit;
    await getAllDataOfATable(req, res);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch data' });
  }
}
const crypto = require('crypto');
const AccessKey = require('../models/accessKeyModel');
const AccessKeyDevice = require('../models/accessKeyDeviceModel');
const AccessKeyDomain = require('../models/accessKeyDomainModel');
const Project = require('../models/projectModel');
const Device = require('../models/deviceModel');
const sequelize = require('../../db');
const { createAccessKeyPair, calculateExpirationDate, hashAccessKeyPair } = require('../utils/accessKeyUtils');
const { get } = require('http');


async function getAllAccessKeysByProjectId(req, res) {
  try {
    // Project ownership already validated by middleware
    const parsedProjectId = req.parsedProjectId;

    // Find all access keys for the project
    const accessKeys = await AccessKey.findAll({
      where: { project_id: parsedProjectId },
      attributes: [
        'access_key_id',
        'access_key_name',
        'expiration_date',
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

async function updateAccessKey(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { access_key_name, domain_name_array, device_id_array } = req.body;

    // Access key ownership already validated by middleware
    const accessKey = req.accessKey;
    const parsedAccessKeyId = req.parsedAccessKeyId;

    // Check if access key is expired
    if (accessKey.expiration_date && new Date(accessKey.expiration_date) < new Date()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Access key has expired and cannot be updated',
      });
    }

    // Update access key name if provided
    if (access_key_name) {
      await accessKey.update({ access_key_name }, { transaction });
    }

    // Update domains if provided
    if (domain_name_array) {
      const existingDomains = await AccessKeyDomain.findAll({
        where: { access_key_id: parsedAccessKeyId },
        transaction,
      });
      const existingDomainNames = existingDomains.map(d => d.access_key_domain_name);

      const domainsToAdd = domain_name_array.filter(domain => !existingDomainNames.includes(domain));

      const domainsToRemove = existingDomains.filter(d => !domain_name_array.includes(d.access_key_domain_name));

      // Remove domains that are no longer in the list
      if (domainsToRemove.length > 0) {
        await AccessKeyDomain.destroy({
          where: {
            access_key_domain_id: domainsToRemove.map(d => d.access_key_domain_id),
          },
          transaction,
        });
      }

      // Add new domains
      if (domainsToAdd.length > 0) {
        const domainRecords = domainsToAdd.map(domain => ({
          access_key_domain_name: domain,
          access_key_id: parsedAccessKeyId,
        }));
        await AccessKeyDomain.bulkCreate(domainRecords, { transaction });
      }
    }

    // Update devices if provided
    if (device_id_array) {
      const existingDevices = await AccessKeyDevice.findAll({
        where: { access_key_id: parsedAccessKeyId },
        transaction,
      });
      const existingDeviceIds = existingDevices.map(d => d.device_id);

      const devicesToAdd = device_id_array.filter(id => !existingDeviceIds.includes(id));

      const devicesToRemove = existingDevices.filter(d => !device_id_array.includes(d.device_id));

      // Verify new devices belong to the project
      if (devicesToAdd.length > 0) {
        const devices = await Device.findAll({
          where: {
            device_id: devicesToAdd,
            project_id: accessKey.project_id,
          },
          transaction,
        });

        if (devices.length !== devicesToAdd.length) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'One or more devices not found or do not belong to this project',
          });
        }
      }

      // Remove devices that are no longer in the list
      if (devicesToRemove.length > 0) {
        await AccessKeyDevice.destroy({
          where: {
            access_key_device_id: devicesToRemove.map(d => d.access_key_device_id),
          },
          transaction,
        });
      }

      // Add new devices
      if (devicesToAdd.length > 0) {
        const deviceRecords = devicesToAdd.map(device_id => ({
          device_id,
          access_key_id: parsedAccessKeyId,
        }));
        await AccessKeyDevice.bulkCreate(deviceRecords, { transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Access key updated successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating access key:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update access key',
    });
  }
}

async function createAccessKey(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const { project_id, domain_name_array, device_id_array, valid_duration_for_access_key, access_key_name } = req.body;

    // Project ownership already validated by middleware
    // req.project and req.parsedProjectId are available

    if (!access_key_name || !domain_name_array || !device_id_array || !valid_duration_for_access_key) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: access_key_name, domain_name_array, device_id_array, valid_duration_for_access_key',
      });
    }

    if (!Array.isArray(domain_name_array) || !Array.isArray(device_id_array)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'domain_name_array and device_id_array must be arrays',
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

async function getAccessKeyById(req, res) {
  try {
    const key = req.accessKey;
    const parsedId = req.parsedAccessKeyId;

    if (!parsedId || !key) {
      return res.status(404).json({ success: false, message: 'Access key not found' });
    }

    const deviceRows = await AccessKeyDevice.findAll({
      where: { access_key_id: parsedId },
      attributes: ['device_id'],
    });

    const domainRows = await AccessKeyDomain.findAll({
      where: { access_key_id: parsedId },
      attributes: ['access_key_domain_name'],
    });

    const expirationDate = key.expiration_date;
    const isExpired = expirationDate ? new Date(expirationDate) <= new Date() : false;

    return res.status(200).json({
      access_key_id: key.access_key_id,
      access_key_name: key.access_key_name,
      project_id: key.project_id,
      expiration_date: key.expiration_date,
      access_key_last_use_time: key.access_key_last_use_time ?? null,
      device_ids: deviceRows.map(d => d.device_id),
      access_key_domain_names: domainRows.map(d => d.access_key_domain_name),
      is_expired: isExpired,
    });
  } catch (error) {
    console.error('Error getting access key by id:', error);
    return res.status(500).json({ success: false, message: 'Failed to get access key' });
  }
}

async function deleteAccessKey(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const accessKey = req.accessKey;

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

/**
 * Renew an expired access key
 * Expects: { access_key_id, valid_duration_for_access_key }
 * Ownership and JWT are verified by middleware
 */
async function renewAccessKey(req, res) {

  try {
    // Ownership already validated by middleware
    const accessKey = req.accessKey;
    const parsedAccessKeyId = req.parsedAccessKeyId;
    const { valid_duration_for_access_key } = req.body;

    if (!valid_duration_for_access_key) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: valid_duration_for_access_key',
      });
    }

    const transaction = await sequelize.transaction();

    // Only allow renewal if expired
    if (!accessKey.expiration_date || new Date(accessKey.expiration_date) > new Date()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Access key is not expired and cannot be renewed',
      });
    }


    // Only extend the expiration date 
    const expirationDate = calculateExpirationDate(valid_duration_for_access_key);
    await accessKey.update({
      expiration_date: expirationDate,
      updated_at: new Date(),
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      access_key_id: accessKey.access_key_id,
      access_key_name: accessKey.access_key_name,
      expiration_date: expirationDate,
      note: 'Access key expiration has been extended.'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error renewing access key:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to renew access key',
    });
  }
}

module.exports = {
  createAccessKey,
  getAllAccessKeysByProjectId,
  deleteAccessKey,
  updateAccessKey,
  getAccessKeyById,
  renewAccessKey,
  getAllDevicesForExternal,
  getAllDataForExternal,
};
