const SharedDashboard = require('../models/sharedDashboardModel');
const Project = require('../models/projectModel');
const Widget = require('../models/widgetModel');
const DataTable = require('../models/dataTableModel');
const ChartWidget = require('../models/chartWidgetModel');
const ChartSeries = require('../models/chartSeriesModel');
const ParameterTableWidget = require('../models/parameterTableWidgetModel');
const ToggleWidget = require('../models/toggleWidgetModel');
const GaugeWidget = require('../models/gaugeWidgetModel');
const MetricWidget = require('../models/metricWidgetModel');
const Column = require('../models/columnModel');
const Device = require('../models/deviceModel');
const sequelize = require('../../db');
const { Op } = require('sequelize');

/**
 * Validate share token and check expiration
 * @param {string} shareToken
 * @returns {Object|null} SharedDashboard record or null if invalid/expired
 */
async function validateShareToken(shareToken) {
  const share = await SharedDashboard.findOne({
    where: {
      share_token: shareToken,
      is_active: true,
    },
  });

  if (!share) {
    return null;
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null;
  }

  return share;
}

/**
 * Get public dashboard data by share token
 * GET /api/public/dashboard/:shareToken
 * No authentication required
 */
async function getPublicDashboard(req, res) {
  try {
    const { shareToken } = req.params;

    if (!shareToken) {
      return res.status(400).json({
        success: false,
        message: 'Share token is required',
      });
    }

    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    // Get project info
    const project = await Project.findByPk(share.project_id, {
      attributes: ['project_id', 'project_name'],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Get widgets that are allowed in this share
    const widgets = await Widget.findAll({
      where: {
        id: { [Op.in]: share.allowed_widget_ids },
        project_id: share.project_id,
      },
      include: [{
        model: DataTable,
        attributes: ['tbl_name'],
      }],
    });

    // Build configurations for each widget (same logic as widgetController)
    const widgetsWithConfig = [];
    for (let widget of widgets) {
      let configuration = {};

      if (widget.widget_type === 1) {
        // Chart widget
        configuration = await ChartWidget.findOne({
          where: { widget_id: widget.id },
          include: [{
            model: ChartSeries,
          }],
        });
      } else if (widget.widget_type === 2) {
        // Parameter table widget
        configuration = await ParameterTableWidget.findAll({
          where: { widget_id: widget.id },
          include: [
            { model: Column, attributes: ['clm_name'] },
            { model: Device, attributes: ['device_name'] },
          ],
        });
      } else if (widget.widget_type === 3) {
        // Toggle widget
        configuration = await ToggleWidget.findOne({
          where: { widget_id: widget.id },
          include: [
            { model: Column, attributes: ['clm_name'] },
            { model: Device, attributes: ['device_name'] },
          ],
        });
      } else if (widget.widget_type === 4) {
        // Gauge widget
        configuration = await GaugeWidget.findOne({
          where: { widget_id: widget.id },
          include: [
            { model: Column, attributes: ['clm_name'] },
            { model: Device, attributes: ['device_name'] },
          ],
        });
      } else if (widget.widget_type === 5) {
        // Metric widget
        configuration = await MetricWidget.findOne({
          where: { widget_id: widget.id },
        });
      }

      widgetsWithConfig.push({
        id: widget.id,
        widget_name: widget.widget_name,
        widget_type: widget.widget_type,
        dataset: widget.dataset,
        DataTable: widget.DataTable,
        configuration: configuration,
      });
    }

    return res.status(200).json({
      success: true,
      share_name: share.share_name,
      project: {
        project_id: project.project_id,
        project_name: project.project_name,
      },
      widgets: widgetsWithConfig,
    });
  } catch (error) {
    console.error('Error getting public dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load public dashboard',
    });
  }
}

/**
 * Get toggle widget data for public dashboard
 * GET /api/public/dashboard/:shareToken/toggle/:widgetId
 */
async function getPublicToggleData(req, res) {
  try {
    const { shareToken, widgetId } = req.params;

    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    // Verify widget is allowed in this share
    if (!share.allowed_widget_ids.includes(parseInt(widgetId))) {
      return res.status(403).json({
        success: false,
        message: 'Widget not available in this shared dashboard',
      });
    }

    const widget = await Widget.findByPk(widgetId);
    if (!widget || widget.project_id !== share.project_id) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found',
      });
    }

    const configuration = await ToggleWidget.findOne({
      where: { widget_id: widgetId },
      include: [{ model: Column, attributes: ['clm_name'] }],
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    const tableName = 'datatable_' + widget.dataset;
    let sql = `SELECT ${configuration.Column.clm_name} FROM "public"."${tableName}"`;
    if (configuration.device_id) {
      sql += ` WHERE device = ${configuration.device_id}`;
    }
    sql += ` ORDER BY id DESC LIMIT 1`;

    const data = await sequelize.query(sql);

    if (data[0][0] && (data[0][0][configuration.Column.clm_name] === true || data[0][0][configuration.Column.clm_name] === false)) {
      return res.status(200).json(data[0][0]);
    } else {
      return res.status(500).json({
        success: false,
        message: 'Data is not boolean',
      });
    }
  } catch (error) {
    console.error('Error retrieving public toggle data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve data',
    });
  }
}

/**
 * Get gauge widget data for public dashboard
 * GET /api/public/dashboard/:shareToken/gauge/:widgetId
 */
async function getPublicGaugeData(req, res) {
  try {
    const { shareToken, widgetId } = req.params;

    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    if (!share.allowed_widget_ids.includes(parseInt(widgetId))) {
      return res.status(403).json({
        success: false,
        message: 'Widget not available in this shared dashboard',
      });
    }

    const widget = await Widget.findByPk(widgetId);
    if (!widget || widget.project_id !== share.project_id) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found',
      });
    }

    const configuration = await GaugeWidget.findOne({
      where: { widget_id: widgetId },
      include: [{ model: Column, attributes: ['clm_name'] }],
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    const tableName = `"public".datatable_${widget.dataset}`;
    let query = `SELECT ${configuration.Column.clm_name} FROM ${tableName}`;
    if (configuration.device_id) {
      query += ` WHERE device = ${configuration.device_id}`;
    }
    query += ` ORDER BY id DESC LIMIT 1`;

    const result = await sequelize.query(query);

    if (result[0][0] && result[0][0][configuration.Column.clm_name] !== undefined) {
      if (isNaN(result[0][0][configuration.Column.clm_name])) {
        return res.status(500).json({ message: 'Value is not a number' });
      }
      return res.status(200).json(result[0][0]);
    } else {
      return res.status(404).json({ message: 'Value is not available' });
    }
  } catch (error) {
    console.error('Error retrieving public gauge data:', error);
    return res.status(500).json({ message: 'Failed to retrieve data' });
  }
}

/**
 * Get chart widget data for public dashboard
 * GET /api/public/dashboard/:shareToken/chart/:widgetId
 */
async function getPublicChartData(req, res) {
  try {
    const { shareToken, widgetId } = req.params;
    const { limit: recordLimit } = req.query;

    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    if (!share.allowed_widget_ids.includes(parseInt(widgetId))) {
      return res.status(403).json({
        success: false,
        message: 'Widget not available in this shared dashboard',
      });
    }

    const widget = await Widget.findByPk(widgetId);
    if (!widget || widget.project_id !== share.project_id) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found',
      });
    }

    const configuration = await ChartWidget.findOne({
      where: { widget_id: widgetId },
      include: [
        {
          model: ChartSeries,
          attributes: ['clm_id', 'device_id', 'series_name'],
          include: [{ model: Column, attributes: ['clm_name'] }],
        },
        { model: Column, attributes: ['clm_name'] },
      ],
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    const tableName = `"public".datatable_${widget.dataset}`;

    let chartData = [];
    for (let series of configuration.ChartSeries) {
      chartData.push({
        name: series.series_name,
        clm_name: series.Column.clm_name,
        device_id: series.device_id,
        data: [],
      });
    }

    let x_axis = configuration.Column == null ? 'created_at' : configuration.Column.clm_name;

    for (let data of chartData) {
      let sql = `SELECT id, ${x_axis}, ${data.clm_name} FROM ${tableName} WHERE device = ${data.device_id} ORDER BY id DESC`;
      if (recordLimit) {
        sql += ` LIMIT ${recordLimit}`;
      }
      const result = await sequelize.query(sql);
      data.data = result[0].map((record) => ({
        x: x_axis === 'created_at' ? new Date(record[x_axis]) : record[x_axis],
        y: record[data.clm_name],
      }));
    }

    return res.status(200).json(chartData);
  } catch (error) {
    console.error('Error retrieving public chart data:', error);
    return res.status(500).json({ message: 'Failed to retrieve data' });
  }
}

/**
 * Get parameter table widget data for public dashboard
 * GET /api/public/dashboard/:shareToken/table/:widgetId
 */
async function getPublicParameterTableData(req, res) {
  try {
    const { shareToken, widgetId } = req.params;

    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    if (!share.allowed_widget_ids.includes(parseInt(widgetId))) {
      return res.status(403).json({
        success: false,
        message: 'Widget not available in this shared dashboard',
      });
    }

    const widget = await Widget.findByPk(widgetId);
    if (!widget || widget.project_id !== share.project_id) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found',
      });
    }

    const configuration = await ParameterTableWidget.findAll({
      where: { widget_id: widgetId },
      include: [
        { model: Column, attributes: ['clm_name'] },
        { model: Device, attributes: ['device_name'] },
      ],
    });

    if (!configuration || configuration.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    const tableName = `"public".datatable_${widget.dataset}`;
    let tableData = [];

    const queryPromises = configuration.map((config) => {
      let sql = `SELECT ${config.Column.clm_name} FROM ${tableName}`;
      if (config.device_id) {
        sql += ` WHERE device = ${config.device_id}`;
      }
      sql += ` ORDER BY id DESC LIMIT 1`;

      return sequelize.query(sql).then((result) => ({ config, result }));
    });

    const queryResults = await Promise.all(queryPromises);

    tableData = queryResults.map(({ config, result }) => ({
      parameter_name: config.parameter_name,
      clm_name: config.Column.clm_name,
      device_name: config.Device?.device_name || 'All Devices',
      value: result[0][0] ? result[0][0][config.Column.clm_name] : null,
      unit: config.unit,
    }));
    return res.status(200).json(tableData);
  } catch (error) {
    console.error('Error retrieving public parameter table data:', error);
    return res.status(500).json({ message: 'Failed to retrieve data' });
  }
}

/**
 * Get full table widget data with pagination for public dashboard (expanded view)
 * GET /api/public/dashboard/:shareToken/table/:widgetId/full
 */
async function getPublicFullTableData(req, res) {
  try {
    const { shareToken, widgetId } = req.params;
    const { offset: rawOffset = 0, limit: rawLimit = 100 } = req.query;

    const offset = parseInt(rawOffset, 10);
    const limit = parseInt(rawLimit, 10);
    const MAX_LIMIT = 1000;

    if (
      Number.isNaN(offset) ||
      Number.isNaN(limit) ||
      offset < 0 ||
      limit <= 0 ||
      limit > MAX_LIMIT
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid pagination parameters. "offset" must be a non-negative integer and "limit" must be a positive integer not greater than ${MAX_LIMIT}.`,
      });
    }
    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    if (!share.allowed_widget_ids.includes(parseInt(widgetId))) {
      return res.status(403).json({
        success: false,
        message: 'Widget not available in this shared dashboard',
      });
    }

    const widget = await Widget.findByPk(widgetId, {
      include: {
        model: DataTable,
        attributes: ['tbl_name']
      }
    });

    if (!widget || widget.project_id !== share.project_id) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found',
      });
    }

    const widgetConfiguration = await ParameterTableWidget.findAll({
      where: { widget_id: widgetId },
      include: {
        model: Column,
        attributes: ['clm_name']
      }
    });

    if (!widgetConfiguration || widgetConfiguration.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Widget configuration not found',
      });
    }

    // Build attributes list
    let attributes = [];
    for (let i = 0; i < widgetConfiguration.length; i++) {
      attributes.push(widgetConfiguration[i].Column.clm_name);
    }

    // Sort attributes into alphabetical order
    attributes.sort();

    // Move 'id' to start if present
    const index_id = attributes.indexOf('id');
    if (index_id > -1) {
      attributes.splice(index_id, 1);
      attributes.unshift('id');
    }

    // Move 'device' to second position if present
    const index_device = attributes.indexOf('device');
    if (index_device > -1) {
      attributes.splice(index_device, 1);
      if (index_id === -1) {
        attributes.unshift('device');
      } else {
        attributes.splice(1, 0, 'device');
      }
    }

    const tableName = `"public"."datatable_${widget.dataset}"`;

    let sql = `SELECT ${attributes.join(', ')} FROM ${tableName}`;
    if (widgetConfiguration[0].device_id != null) {
      sql += ` WHERE device=${widgetConfiguration[0].device_id}`;
    }
    sql += ` ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`;

    const data = await sequelize.query(sql);

    let countSql = `SELECT COUNT(*) FROM ${tableName}`;
    if (widgetConfiguration[0].device_id != null) {
      countSql += ` WHERE device=${widgetConfiguration[0].device_id}`;
    }
    const count = await sequelize.query(countSql);

    return res.status(200).json({ data: data[0], count: count[0] });
  } catch (error) {
    console.error('Error retrieving public full table data:', error);
    return res.status(500).json({ message: 'Failed to retrieve data' });
  }
}

/**
 * Get metric widget data for public dashboard
 * GET /api/public/dashboard/:shareToken/metric/:widgetId
 * No authentication required
 */
async function getPublicMetricData(req, res) {
  try {
    const { shareToken, widgetId } = req.params;

    const share = await validateShareToken(shareToken);
    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Shared dashboard not found or has expired',
      });
    }

    // Check if widget is allowed in this share
    if (!share.allowed_widget_ids.includes(parseInt(widgetId))) {
      return res.status(403).json({
        success: false,
        message: 'Widget not available in this shared dashboard',
      });
    }

    const widget = await Widget.findByPk(widgetId);
    if (!widget || widget.project_id !== share.project_id) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found',
      });
    }

    const configuration = await MetricWidget.findOne({
      where: { widget_id: widgetId },
      include: [
        {
          model: Column,
          attributes: ['clm_name']
        }
      ]
    });

    if (!configuration || !configuration.Column) {
      return res.status(404).json({ message: 'Widget configuration not found' });
    }

    const tableName = 'datatable_' + widget.dataset;
    let query = `SELECT created_at, ${configuration.Column.clm_name} FROM "public"."${tableName}"`;
    if (configuration.device_id) {
      query += ` WHERE device=${configuration.device_id}`;
    }
    query += ` ORDER BY id DESC LIMIT 1`;

    const result = await sequelize.query(query);

    if (!result || !result[0] || result[0].length === 0) {
      return res.status(200).json({});
    }

    const row = result[0][0];
    let value = row[configuration.Column.clm_name];
    const created_at = row.created_at;

    // Coerce numeric strings to numbers
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        value = parsed;
      }
    }

    const isNumeric = typeof value === 'number' && Number.isFinite(value);
    const isBoolean = typeof value === 'boolean';

    if (isNumeric || isBoolean) {
      return res.status(200).json({ value, created_at });
    }

    return res.status(200).json({});
  } catch (error) {
    console.error('Error retrieving public metric data:', error);
    return res.status(500).json({ message: 'Failed to retrieve data' });
  }
}

module.exports = {
  getPublicDashboard,
  getPublicToggleData,
  getPublicGaugeData,
  getPublicChartData,
  getPublicParameterTableData,
  getPublicFullTableData,
  getPublicMetricData,
};
