const Table = require("../models/dataTableModel");
const Project = require("../models/projectModel");
const Device = require("../models/deviceModel");
const Column = require("../models/columnModel");
const Widget = require("../models/widgetModel");
const ChartWidget = require("../models/chartWidgetModel");
const ChartSeries = require("../models/chartSeriesModel");
const ParameterTableWidget = require("../models/parameterTableWidgetModel");
const ToggleWidget = require("../models/toggleWidgetModel");
const GaugeWidget = require("../models/gaugeWidgetModel");
const MetricWidget = require("../models/metricWidgetModel");
const sequelize = require("../../db");
const { Op } = require("sequelize");

const getAllDataOfATable = async (req, res) => {
  const { tbl_id, offset, limit, order } = req.query;

  const tableName = "datatable_" + tbl_id;

  try {
    const table = await Table.findByPk(tbl_id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    let orderClause = 'ORDER BY dt.id ASC';
    if (order && (order.toUpperCase() === 'ASC' || order.toUpperCase() === 'DESC')) {
      orderClause = `ORDER BY dt.id ${order.toUpperCase()}`;
    }

    let sql = `SELECT dt.*, d.device_name FROM "public"."${tableName}" AS dt INNER JOIN "public"."devices" AS d ON d.device_id = dt.device ${orderClause} LIMIT ${limit} OFFSET ${offset}`;
    const data = await sequelize.query(sql);

    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error retrieving data:", error, tbl_id);
    res.status(500).json({ message: "Failed to retrieve data" });
  }
};

const getCountOfTable = async (tbl_id, res) => {
  const tableName = "datatable_" + tbl_id;
  try {
    const table = await Table.findByPk(tbl_id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    let sql = `SELECT COUNT(*) FROM "public"."${tableName}"`;
    const data = await sequelize.query(sql);
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ message: "Failed to retrieve data" });
  }
};

//Get request to retrieve the count of data records of a project.
// Get tbl_id s of all the tables of a project using given project_id and then get the count of each table using tables with names datatable_<tbl_id>
// If table count is = 0, then return 0
const getRecordCountOfProject = async (project_id, res) => {
  try {
    // Get only tbl_ids of all tables of a project using Table Model
    const tables = await Table.findAll({
      attributes: ["tbl_id"],
      where: {
        project_id: project_id,
      },
    });

    if (!tables || tables.length === 0) {
      return res.status(404).json({ count: 0 });
    }

    let count = 0;
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];

      let sql = `SELECT COUNT(*) FROM "public"."datatable_${table.tbl_id}"`;
      const data = await sequelize.query(sql);
      count += Number(data[0][0].count);
    }

    res.status(200).json({ count: Number(count) });
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ message: "Failed to retrieve data" });
  }
};

// Get request to retrieve the latest updated_at timestamp of all the tables of a project
const getLatestTimestampOfProject = async (project_id, res) => {
  try {
    // Get only tbl_ids of all tables of a project using Table Model
    const tables = await Table.findAll({
      attributes: ["tbl_id"],
      where: {
        project_id: project_id,
      },
    });

    if (!tables || tables.length === 0) {
      return res.status(404).json({ timestamp: null });
    }

    let latestTimestampNumber = 0;
    let timestamp = null;
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];

      /*
       * Get latest updated_at timestamp from datatable_<table.tbl_id>
       * SELECT MAX(updated_at) FROM datatable_<table.tbl_id>
       * Compare it with latestTimestamp
       * If it is greater than latestTimestamp, update latestTimestamp
       */

      let sql = `SELECT MAX(updated_at) FROM "public"."datatable_${table.tbl_id}"`;
      const data = await sequelize.query(sql);

      if (data[0][0].max === null) {
        continue;
      }

      const currentTimestamp = data[0][0].max;

      timestamp = new Date(Math.max(timestamp, currentTimestamp.getTime()));
    }

    if (timestamp === null || timestamp == "") {
      return res.status(404).json({ timestamp: null });
    }
    // Convert timestamp to Sri lanka time zone. timestamp is in GMT time
    timestamp = new Date(timestamp);
    timestamp.setHours(timestamp.getHours() + 5);
    timestamp.setMinutes(timestamp.getMinutes() + 30);

    // Remove T.z and milliseconds from timestamp. Convert it to YYYY-MM-DD HH:MM:SS format
    timestamp = timestamp.toISOString().replace(/T/, " ").replace(/\..+/, "");

    res.status(200).json({ timestamp: timestamp });
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ message: "Failed to retrieve data" });
  }
};

/*
 * Search function for the search functionality in front end
 * Search in :
 ** Projects by project_name belongs to the specific user
 ** Devices by device_name belongs to the projects of the specific user
 ** DataTables by the tbl_name belongs to the projects of the specific user
 ** Widgets by the widget_name belongs to the projects of the specific user
 * Load all projects of the specific user in order to search in other models
 * Search in each model and return the results as the following object :
 * {
 *   projects: [
 *       {
 *           project_id: 1,
 *           project_name: 'Project 1',
 *       },
 *       // More projects
 *   ],
 *   devices: [
 *       {
 *           device_id: 1,
 *           device_name: 'Device 1',
 *       },
 *       // More devices
 *   ],
 *   datatables: [// like above],
 *   widgets: [// like above]
 * }
 * When searching through models, filter queries by selecting the id and name of each model as filtering attributes to reduce the load time
 * Make sure to get all valid results even the keyword is before, in the middle or after the name of the project/device/datatable/widget
 * DO NOT RETRIEVE ALL DEVICES, DATATABLES, WIDGETS AND PROJECTS AND SEARCH IN THEM. USE FILTER QUERIES. LOAD PROJECTS ONLY TO KNOW WHICH PROJECTS ARE BELONGS TO THE USER TO SEARCH IN OTHER MODELS
 * If any error occurs, send a 500 response
 * If there are no results, send the object in above structure with a 200 response
 */
const searchWholeProject = async (keyword, project_id, res) => {
  try {
    // Search in Devices
    const deviceResults = await Device.findAll({
      attributes: ["device_id", "device_name"],
      where: {
        device_name: {
          [Op.iLike]: "%" + keyword + "%",
        },
        project_id: project_id,
      },
    });

    // Search in DataTables
    const datatableResults = await Table.findAll({
      attributes: ["tbl_id", "tbl_name"],
      where: {
        tbl_name: {
          [Op.iLike]: "%" + keyword + "%",
        },
        project_id: project_id,
      },
    });

    // Search in Widgets
    const widgetResults = await Widget.findAll({
      attributes: ["id", "widget_name"],
      where: {
        widget_name: {
          [Op.iLike]: "%" + keyword + "%",
        },
        project_id: project_id,
      },
    });

    res.status(200).json({
      devices: deviceResults,
      datatables: datatableResults,
      widgets: widgetResults,
    });
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ message: "Failed to search" });
  }
};

/*
    * Get data for a toggle widget
    * Load Widget Details Including its Configuration  (Refer getWidgetByID function in widgetController)
    * If the widget is not available, send a 404 Not Found error and return
    * Retrieve clm_name using Column model of the clm_id in widget configuration
    * Get the latest record from the relevant table by generating the correct SQL query.
    * SQL query details are as follows
    * Table name : datatable_<dataset> from widget
    * column : clm_name retrieved earlier
    * where : filter by device_id in widget configuration
    * Get only the latest record by sorting records by id
    * Validate the value whether it is true or false. 
    * If it is true or false, send data with a 200 response
    * If not, send data with a 500 response
    * Wrap all these things with a try-catch block and if any error ocurrs, send 500 response
*/
const getToggleData = async (widget_id, res) => {
  try {
    const widget = await Widget.findByPk(widget_id);

    if (!widget) {
      res.status(404).json({ message: "Widget not found" });
      return;
    }

    const configuration = await ToggleWidget.findOne({
      where: {
        widget_id: widget_id
      },
      include: [{
        model: Column,
        attributes: ['clm_name']
      }]
    });

    if (!configuration) {
      res.status(404).json({ message: "Configuration not found" });
      return;
    }

    const tableName = 'datatable_' + widget.dataset;

    let sql = `SELECT ${configuration.Column.clm_name} FROM "public"."${tableName}"`;
    if (configuration.device_id) {
      sql += ` WHERE device = ${configuration.device_id}`;
    }
    sql += ` ORDER BY id DESC LIMIT 1`;

    const data = await sequelize.query(sql);

    if (data[0][0][configuration.Column.clm_name] == true || data[0][0][configuration.Column.clm_name] == false) {
      res.status(200).json(data[0][0]);
    } else {
      res.status(500).json({ message: "Data is not boolean" });
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ message: 'Failed to retrieve data' });
  }
}

/*
    * Function for loading data of parameter table widgets
*/
const getParameterTableData = async (req, res) => {
  const { widget_id, offset, limit } = req.query;

  try {
    // Check if the widget is available using WidgetModel. Include DataTable Model for dataset column 
    const widget = await Widget.findByPk(widget_id, {
      include: {
        model: Table,
        attributes: ['tbl_name']
      }
    });

    // Get the widget configuration using ParameterTableWidgetModel. Use the widget ID. Include Column Model for clm_id column
    const widgetConfiguration = await ParameterTableWidget.findAll({
      where: {
        widget_id: widget_id
      },
      include: {
        model: Column,
        attributes: ['clm_name']
      }
    });

    // If the widget configuration is not available, send a 404 Not Found error and return
    if (!widgetConfiguration) {
      return res.status(404).json({ message: 'Widget configuration not found' });
    }

    /*
        * Get all records from "public"."datatable_<widget.dataset>" table
        * Only include the columns that are in the widget configuration
        * Widget Configuration Structure : 
        * [
        *   {
        *       "id": Number,
        *       "widget_id": Number
        *       "clm_id": Number
        *       "device_id": Number
        *       "Column" : {
        *           "clm_name": String
        *       }
        *   }
        * ]
        * Use the above clm_names in the array as attributes which are needed to be retrieved
        * If above device_id (device_id is same in every array element. So, the device_id of the array's first element is ok) is null, do not include a where statement
        * If device_id is not null, add a where clause to the sql query to filter data with device=<device_id>
    */

    let attributes = [];
    for (let i = 0; i < widgetConfiguration.length; i++) {
      attributes.push(widgetConfiguration[i].Column.clm_name);
    }

    // Sort attributes into alphabetical order
    attributes.sort();

    // In the attributes array, if there is a element as 'id' move it to the start of the array
    const index_id = attributes.indexOf('id');
    if (index_id > -1) {
      attributes.splice(index_id, 1);
      attributes.unshift('id');
    }

    // In the attributes array, if there is a element as 'device', if index_id is -1, move device to the begning of the array. If not, move it to the second place
    const index_device = attributes.indexOf('device');
    if (index_device > -1) {
      attributes.splice(index_device, 1);
      if (index_id == -1) {
        attributes.unshift('device');
      } else {
        attributes.splice(1, 0, 'device');
      }
    }

    let transaction;
    try {
      transaction = await sequelize.transaction();

      let sql = `SELECT ${attributes.join(', ')} FROM "public"."datatable_${widget.dataset}"`;
      if (widgetConfiguration[0].device_id != null) {
        sql += ` WHERE device=${widgetConfiguration[0].device_id}`;
      }

      // Add offset and limit to the above sql query
      sql += ` ORDER BY id ASC LIMIT ${limit} OFFSET ${offset}`;

      const data = await sequelize.query(sql, { transaction });

      sql = `SELECT COUNT(*) FROM "public"."datatable_${widget.dataset}"`;
      if (widgetConfiguration[0].device_id != null) {
        sql += ` WHERE device=${widgetConfiguration[0].device_id}`;
      }

      const count = await sequelize.query(sql, { transaction });

      await transaction.commit();

      // Send all data with 200 request
      res.status(200).json({ data: data[0], count: count[0] });
    } catch (error) {
      if (transaction) await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

/*
 * Get data for a gauge  widget
 * Load Widget Details Including its Configuration  (Refer getWidgetByID function in widgetController)
 * If the widget is not available, send a 404 Not Found error and return
 * Retrieve clm_name using Column model of the clm_id in widget configuration
 * Get the latest record from the relevant table by generating the correct SQL query.
 * SQL query details are as follows
 * Table name : datatable_<dataset> from widget
 * column : clm_name retrieved earlier
 * where : filter by device_id in widget configuration
 * Get only the latest record by sorting records by id
 * Validate the value whether it is a number.
 * If it is a number, send data with a 200 response
 * If not, send data with a 500 response
 * Wrap all these things with a try-catch block and if any error ocurrs, send 500 response
 */

const getGaugeData = async (widget_id, res) => {
  try {
    const widget = await Widget.findByPk(widget_id);
    if (!widget) {
      res.status(404).json({ message: "Widget not found" });
      return;
    }

    const configuration = await GaugeWidget.findOne({
      where: {
        widget_id: widget_id,
      },
      include: [
        {
          model: Column,
          attributes: ["clm_name"],
        },
      ],
    });

    if (!configuration) {
      res.status(404).json({ message: "Configuration not found" });
      return;
    }

    const tableName = `"public".datatable_${widget.dataset}`;
    let query = `SELECT ${configuration.Column.clm_name} FROM ${tableName}`;
    if (configuration.device_id) {
      query += ` WHERE device = ${configuration.device_id}`;
    }
    query += ` ORDER BY id DESC LIMIT 1`;

    const result = await sequelize.query(query);

    if (result[0][0][configuration.Column.clm_name]) {
      if (isNaN(result[0][0][configuration.Column.clm_name])) {
        res.status(500).json({ message: "Value is not a number" });
        return;
      } else {
        res.status(200).json(result[0][0])
      }
    } else {
      res.status(404).json({ message: "Value is not available" });
      return;
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/*
 * Function for loading data of metric widgets
*/
const getMetricData = async (widget_id, res) => {
  try {
    const widget = await Widget.findByPk(widget_id);
    if (!widget) {
      return res.status(404).json({ message: 'Widget not found' });
    }

    const configuration = await MetricWidget.findOne({
      where: { widget_id: widget_id },
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
      // No data: return empty object as requested
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

    // Not numeric or boolean: return empty object
    return res.status(200).json({});
  } catch (error) {
    console.error('Error retrieving data:', error);
    return res.status(500).json({ message: 'Failed to retrieve data' });
  }
};

/*
 * Function for loading data of chart widgets
 */
const getChartData = async (widget_id, recordLimit, res) => {
  try {
    const widget = await Widget.findByPk(widget_id);

    if (!widget) {
      res.status(404).json({ message: "Widget not found" });
      return;
    }

    const configuration = await ChartWidget.findOne({
      where: {
        widget_id: widget_id,
      },
      include: [
        {
          model: ChartSeries,
          attributes: ["clm_id", "device_id", "series_name"],
          include: [
            {
              model: Column,
              attributes: ["clm_name"],
            },
          ],
        },
        {
          model: Column,
          attributes: ["clm_name"],
        }
      ],
    });

    if (!configuration) {
      res.status(404).json({ message: "Configuration not found" });
      return;
    }

    const tableName = `"public".datatable_${widget.dataset}`;

    let chartData = [];
    for (let series of configuration.ChartSeries) {
      chartData.push({
        name: series.series_name,
        clm_name: series.Column.clm_name,
        device_id: series.device_id,
        data: []
      });
    }

    let x_axis = '';
    if (configuration.Column == null) {
      x_axis = 'created_at';
    } else {
      x_axis = configuration.Column.clm_name;
    }

    for (let data of chartData) {
      let sql = `SELECT id, ${x_axis},${data.clm_name} FROM ${tableName} WHERE device = ${data.device_id} ORDER BY id DESC`;
      if (recordLimit) {
        sql += ` LIMIT ${recordLimit}`;
      }
      const result = await sequelize.query(sql);
      data.data = result[0].map((record) => {
        return {
          x: (x_axis == 'created_at') ? new Date(record[x_axis]) : record[x_axis],
          y: record[data.clm_name]
        }
      });
    }

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ message: "Failed to retrieve data" });
  }
};

module.exports = {
  getAllDataOfATable,
  getCountOfTable,
  getRecordCountOfProject,
  getLatestTimestampOfProject,
  getToggleData,
  getGaugeData,
  getParameterTableData,
  getChartData,
  searchWholeProject,
  getMetricData
};
