const express = require('express');
const router = express.Router();
const { createAccessKey } = require('../controllers/accessKeyController');

/**
 * POST /api/access-key
 headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Request body:
 * {
 *   project_id: number,
 *   access_key_name: string (optional),
 *   domain_name_array: string[],
 *   device_id_array: number[],
 *   valid_duration_for_access_key: number (days)
 * }
 */
router.post('/', async (req, res) => {
  const { project_id, domain_name_array, device_id_array, valid_duration_for_access_key } = req.body;

  if (!project_id || !domain_name_array || !device_id_array || !valid_duration_for_access_key) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: project_id, domain_name_array, device_id_array, valid_duration_for_access_key',
    });
  }

  if (!Array.isArray(domain_name_array) || !Array.isArray(device_id_array)) {
    return res.status(400).json({
      success: false,
      message: 'domain_name_array and device_id_array must be arrays',
    });
  }

  await createAccessKey(req, res);
});

module.exports = router;
