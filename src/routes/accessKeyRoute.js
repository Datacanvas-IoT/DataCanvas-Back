const express = require('express');
const router = express.Router();
const { createAccessKey, getAllAccessKeysByUserId } = require('../controllers/accessKeyController');

/**
 * GET /api/access-key
 * Get all access keys for the logged-in user
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Response:
 * {
 *   success: boolean,
 *   count: number,
 *   access_keys: AccessKey[]
 * }
 */
router.get('/', async (req, res) => {
  await getAllAccessKeysByUserId(req, res);
});

/**
 * POST /api/access-key
 * Headers:
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

  await createAccessKey(req, res);
});

module.exports = router;
