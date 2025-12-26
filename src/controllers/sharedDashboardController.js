const crypto = require('crypto');
const SharedDashboard = require('../models/sharedDashboardModel');
const SharedDashboardWidget = require('../models/sharedDashboardWidgetModel');
const Project = require('../models/projectModel');
const Widget = require('../models/widgetModel');

/**
 * Generate a secure share token
 * @returns {string} 64-character hex token
 */
function generateShareToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Helper function to get allowed widget IDs for a shared dashboard
 * @param {number} shareId
 * @returns {Promise<number[]>} Array of widget IDs
 */
async function getAllowedWidgetIds(shareId) {
  const sharedWidgets = await SharedDashboardWidget.findAll({
    where: { share_id: shareId },
    attributes: ['widget_id'],
  });
  return sharedWidgets.map(sw => sw.widget_id);
}

/**
 * Create a new shared dashboard link
 * POST /api/share
 */
async function createSharedDashboard(req, res) {
  try {
    const userId = req.user.id || req.user.user_id;
    const { project_id, allowed_widget_ids, share_name, expires_at } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: project_id',
      });
    }

    if (!allowed_widget_ids || !Array.isArray(allowed_widget_ids) || allowed_widget_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'allowed_widget_ids must be a non-empty array',
      });
    }

    // Verify the project exists and belongs to the user
    const project = await Project.findByPk(project_id);
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

    // Verify all widget IDs belong to this project
    const widgets = await Widget.findAll({
      where: {
        id: allowed_widget_ids,
        project_id: project_id,
      },
    });

    if (widgets.length !== allowed_widget_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more widget IDs are invalid or do not belong to this project',
      });
    }

    // Generate unique share token
    const shareToken = generateShareToken();

    // Create the shared dashboard record
    const sharedDashboard = await SharedDashboard.create({
      share_token: shareToken,
      project_id: project_id,
      share_name: share_name || `Share ${new Date().toLocaleDateString()}`,
      is_active: true,
      expires_at: expires_at || null,
    });

    // Create junction table records for allowed widgets
    const widgetRecords = allowed_widget_ids.map(widgetId => ({
      share_id: sharedDashboard.share_id,
      widget_id: widgetId,
    }));
    await SharedDashboardWidget.bulkCreate(widgetRecords);

    return res.status(201).json({
      success: true,
      message: 'Shared dashboard created successfully',
      share: {
        share_id: sharedDashboard.share_id,
        share_token: sharedDashboard.share_token,
        share_name: sharedDashboard.share_name,
        allowed_widget_ids: allowed_widget_ids,
        is_active: sharedDashboard.is_active,
        expires_at: sharedDashboard.expires_at,
        created_at: sharedDashboard.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating shared dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create shared dashboard',
    });
  }
}

/**
 * Get all shared dashboards for a project
 * GET /api/share?project_id=X
 */
async function getSharesByProject(req, res) {
  try {
    const userId = req.user.id || req.user.user_id;
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameter: project_id',
      });
    }

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

    // Find all shared dashboards for the project with their allowed widgets
    const shares = await SharedDashboard.findAll({
      where: { project_id: parsedProjectId },
      include: [{
        model: SharedDashboardWidget,
        as: 'sharedWidgets',
        attributes: ['widget_id'],
      }],
      order: [['created_at', 'DESC']],
    });

    // Transform response to include allowed_widget_ids array for backward compatibility
    const transformedShares = shares.map(share => ({
      share_id: share.share_id,
      share_token: share.share_token,
      share_name: share.share_name,
      allowed_widget_ids: share.sharedWidgets.map(sw => sw.widget_id),
      is_active: share.is_active,
      expires_at: share.expires_at,
      created_at: share.created_at,
      updated_at: share.updated_at,
    }));

    return res.status(200).json({
      success: true,
      count: transformedShares.length,
      shares: transformedShares,
    });
  } catch (error) {
    console.error('Error getting shared dashboards:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get shared dashboards',
    });
  }
}

/**
 * Update a shared dashboard (widget selection, name, active status)
 * PUT /api/share
 */
async function updateSharedDashboard(req, res) {
  try {
    const userId = req.user.id || req.user.user_id;
    const { share_id, allowed_widget_ids, share_name, is_active, expires_at } = req.body;

    if (!share_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: share_id',
      });
    }

    // Find the shared dashboard
    const sharedDashboard = await SharedDashboard.findByPk(share_id);
    if (!sharedDashboard) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found',
      });
    }

    // Verify ownership via project
    const project = await Project.findByPk(sharedDashboard.project_id);
    if (!project || project.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this shared dashboard',
      });
    }

    // If updating widget IDs, verify they belong to the project
    if (allowed_widget_ids && Array.isArray(allowed_widget_ids)) {
      if (allowed_widget_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'allowed_widget_ids cannot be empty',
        });
      }

      const widgets = await Widget.findAll({
        where: {
          id: allowed_widget_ids,
          project_id: sharedDashboard.project_id,
        },
      });

      if (widgets.length !== allowed_widget_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more widget IDs are invalid or do not belong to this project',
        });
      }

      // Delete existing widget associations and create new ones
      await SharedDashboardWidget.destroy({
        where: { share_id: share_id },
      });

      const widgetRecords = allowed_widget_ids.map(widgetId => ({
        share_id: share_id,
        widget_id: widgetId,
      }));
      await SharedDashboardWidget.bulkCreate(widgetRecords);
    }

    // Update other fields if provided
    if (share_name !== undefined) {
      sharedDashboard.share_name = share_name;
    }
    if (is_active !== undefined) {
      sharedDashboard.is_active = is_active;
    }
    if (expires_at !== undefined) {
      sharedDashboard.expires_at = expires_at;
    }

    await sharedDashboard.save();

    // Get updated widget IDs for response
    const updatedWidgetIds = await getAllowedWidgetIds(share_id);

    return res.status(200).json({
      success: true,
      message: 'Shared dashboard updated successfully',
      share: {
        share_id: sharedDashboard.share_id,
        share_token: sharedDashboard.share_token,
        share_name: sharedDashboard.share_name,
        allowed_widget_ids: updatedWidgetIds,
        is_active: sharedDashboard.is_active,
        expires_at: sharedDashboard.expires_at,
        updated_at: sharedDashboard.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating shared dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update shared dashboard',
    });
  }
}

/**
 * Delete/revoke a shared dashboard
 * DELETE /api/share/:share_id
 */
async function deleteSharedDashboard(req, res) {
  try {
    const userId = req.user.id || req.user.user_id;
    const { share_id } = req.params;

    const parsedShareId = Number(share_id);
    if (!Number.isInteger(parsedShareId) || parsedShareId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid share_id: must be a positive integer',
      });
    }

    // Find the shared dashboard
    const sharedDashboard = await SharedDashboard.findByPk(parsedShareId);
    if (!sharedDashboard) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found',
      });
    }

    // Verify ownership via project
    const project = await Project.findByPk(sharedDashboard.project_id);
    if (!project || project.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not own this shared dashboard',
      });
    }

    await sharedDashboard.destroy();

    return res.status(200).json({
      success: true,
      message: 'Shared dashboard deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shared dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete shared dashboard',
    });
  }
}

module.exports = {
  createSharedDashboard,
  getSharesByProject,
  updateSharedDashboard,
  deleteSharedDashboard,
};
