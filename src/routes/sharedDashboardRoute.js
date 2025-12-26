const express = require('express');
const router = express.Router();
const {
  createSharedDashboard,
  getSharesByProject,
  updateShare,
  deleteShare,
} = require('../controllers/sharedDashboardController');

/**
 * GET /api/share?project_id=<PROJECT_ID>
 * Get all shared dashboards for a specific project
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
 *   shares: SharedDashboard[]
 * }
 */
router.get('/', async (req, res) => {
  await getSharesByProject(req, res);
});

/**
 * POST /api/share
 * Create a new shared dashboard link
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Request body:
 * {
 *   project_id: number (required),
 *   allowed_widget_ids: number[] (required),
 *   share_name: string (optional),
 *   expires_at: string | null (optional)
 * }
 * 
 * Success Response (201):
 * {
 *   success: boolean,
 *   message: string,
 *   share: SharedDashboard
 * }
 */
router.post('/', async (req, res) => {
  await createSharedDashboard(req, res);
});

/**
 * PUT /api/share
 * Update an existing shared dashboard
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Request body:
 * {
 *   share_id: number (required),
 *   allowed_widget_ids: number[] (optional),
 *   share_name: string (optional),
 *   is_active: boolean (optional),
 *   expires_at: string | null (optional)
 * }
 * 
 * Success Response (200):
 * {
 *   success: boolean,
 *   message: string,
 *   share: SharedDashboard
 * }
 */
router.put('/', async (req, res) => {
  await updateShare(req, res);
});

/**
 * DELETE /api/share
 * Delete/revoke a shared dashboard
 * 
 * Headers:
 * - Authorization: Bearer <JWT_TOKEN>
 * 
 * Request body:
 * {
 *   share_id: number (required)
 * }
 * 
 * Success Response (200):
 * {
 *   success: boolean,
 *   message: string
 * }
 */
router.delete('/', async (req, res) => {
  await deleteShare(req, res);
});

module.exports = router;
