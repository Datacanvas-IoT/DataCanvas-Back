const express = require('express');
const router = express.Router();
const { createAccessKey, getAllAccessKeysByProjectId, deleteAccessKey } = require('../controllers/accessKeyController');

/**
 * GET /api/access-key?project_id=<PROJECT_ID>
 * Get all access keys for a specific project
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Query Parameters:
 * - project_id: number (required)
 * 
 * Success Response (200):
 * {
 *   success: boolean,
 *   count: number,
 *   access_keys: AccessKey[]
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: { success: false, message: 'Missing required query parameter: project_id' }
 * - 400 Bad Request: { success: false, message: 'Invalid project_id: must be a number' }
 * - 403 Forbidden: { success: false, message: 'Forbidden: You do not own this project' }
 * - 404 Not Found: { success: false, message: 'Project not found' }
 * - 500 Internal Server Error: { success: false, message: 'Failed to get access keys' }
 */
router.get('/', async (req, res) => {
  await getAllAccessKeysByProjectId(req, res);
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
  const { project_id, access_key_name, domain_name_array, device_id_array, valid_duration_for_access_key } = req.body;

  await createAccessKey(req, res);
});

/**
 * DELETE /api/access-key/:access_key_id
 * Delete an access key and all associated domains and devices
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * URL Parameters:
 * - access_key_id: number (required)
 * 
 * Success Response (200):
 * {
 *   success: boolean,
 *   message: string
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: { success: false, message: 'Invalid access_key_id: must be a number' }
 * - 403 Forbidden: { success: false, message: 'Forbidden: You do not own this access key' }
 * - 404 Not Found: { success: false, message: 'Access key not found' }
 * - 500 Internal Server Error: { success: false, message: 'Failed to delete access key' }
 */
router.delete('/:access_key_id', async (req, res) => {
  await deleteAccessKey(req, res);
});

module.exports = router;
