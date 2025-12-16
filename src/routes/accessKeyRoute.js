const express = require('express');
const router = express.Router();
const { createAccessKey, getAllAccessKeysByProjectId, updateAccessKey, deleteAccessKey } = require('../controllers/accessKeyController');
const verifyOwnership = require('../middlewares/verifyOwnership');

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
router.get('/', verifyOwnership('project', 'query'), async (req, res) => {
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
router.post('/', verifyOwnership('project', 'body'), async (req, res) => {
  await createAccessKey(req, res);
});

/**
 * PUT /api/access-key/:access_key_id
 * Update an existing access key (only name, domains, and devices can be updated)
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * URL Parameters:
 * - access_key_id: number (required)
 * 
 * Request body (at least one field required):
 * {
 *   access_key_name: string (optional),
 *   domain_name_array: string[] (optional),
 *   device_id_array: number[] (optional)
 * }
 * 
 * Success Response (200):
 * {
 *   success: boolean,
 *   message: string,
 *   access_key: {
 *     access_key_id: number,
 *     access_key_name: string,
 *     accessible_domains: string[],
 *     accessible_devices: number[]
 *   }
 * }
 * 
 * Error Responses:
 * - 400 Bad Request: { success: false, message: 'Invalid access_key_id: must be a number' }
 * - 403 Forbidden: { success: false, message: 'Forbidden: You do not own this access key' }
 * - 404 Not Found: { success: false, message: 'Access key not found' }
 * - 404 Not Found: { success: false, message: 'One or more devices not found...' }
 * - 500 Internal Server Error: { success: false, message: 'Failed to update access key' }
 */
router.put('/:access_key_id', verifyOwnership('accessKey', 'params'), async (req, res) => {
  await updateAccessKey(req, res);
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
router.delete('/:access_key_id', verifyOwnership('accessKey', 'params'), async (req, res) => {
  await deleteAccessKey(req, res);
});


module.exports = router;
