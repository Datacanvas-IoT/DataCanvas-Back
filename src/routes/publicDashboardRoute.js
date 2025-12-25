const express = require('express');
const router = express.Router();
const {
  getPublicDashboard,
  getPublicToggleData,
  getPublicGaugeData,
  getPublicChartData,
  getPublicParameterTableData,
} = require('../controllers/publicDashboardController');

/**
 * GET /api/public/dashboard/:shareToken
 * Get public dashboard data by share token
 * No authentication required
 * 
 * Path Parameters:
 * - shareToken: string (required)
 * 
 * Success Response (200):
 * {
 *   success: boolean,
 *   share_name: string,
 *   project: { project_id: number, project_name: string },
 *   widgets: Widget[]
 * }
 */
router.get('/dashboard/:shareToken', async (req, res) => {
  await getPublicDashboard(req, res);
});

/**
 * GET /api/public/dashboard/:shareToken/toggle/:widgetId
 * Get toggle widget data for public dashboard
 * No authentication required
 */
router.get('/dashboard/:shareToken/toggle/:widgetId', async (req, res) => {
  await getPublicToggleData(req, res);
});

/**
 * GET /api/public/dashboard/:shareToken/gauge/:widgetId
 * Get gauge widget data for public dashboard
 * No authentication required
 */
router.get('/dashboard/:shareToken/gauge/:widgetId', async (req, res) => {
  await getPublicGaugeData(req, res);
});

/**
 * GET /api/public/dashboard/:shareToken/chart/:widgetId
 * Get chart widget data for public dashboard
 * No authentication required
 * 
 * Query Parameters:
 * - limit: number (optional) - limit number of records
 */
router.get('/dashboard/:shareToken/chart/:widgetId', async (req, res) => {
  await getPublicChartData(req, res);
});

/**
 * GET /api/public/dashboard/:shareToken/table/:widgetId
 * Get parameter table widget data for public dashboard
 * No authentication required
 */
router.get('/dashboard/:shareToken/table/:widgetId', async (req, res) => {
  await getPublicParameterTableData(req, res);
});

module.exports = router;
