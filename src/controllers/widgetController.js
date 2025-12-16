const Project = require("../models/projectModel");
const DataTable = require("../models/dataTableModel");
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

/*
    * REQUEST STRUCTURE FOR WIDGET OBJECT WHEN ADDING AND UPDATING
    * {
    *   "widget_name": "Widget Name",
    *   "widget_type": 1,
    *   "dataset": <tbl_id from DataTable>,
    *   "project_id": <project_id from Project>,
    *  "configuration": {
    *       CONFIGURATION CHANGES ACCORDING TO THE WIDGET TYPE. VARIOUS CONFIGURATION EXAMPLES ARE SHOWN BELOW
    *  }
    * -----------------------------------------------------------------
    * CONFIGURATION FOR CHARTS
    *  "configuration": {
    *       "chart_type": 1,
    *      "x_axis": <clm_id from Column> or null for no x-axis, null for timestamp (created_at) column
    *      "series": [
    *         {
    *              "series_name": "Series Name",
    *              "clm_id": <clm_id from Column>
    *              "device_id": <device_id from Device> or null for all devices, 0 - for all devices
    *        },
    *        {
    *             ... (more series) ...
    *       }
    *   ]
    * }
    * -----------------------------------------------------------------
    * CONFIGURATION FOR PARAMETER TABLES
    * "configuration": {
    *    "columns": [
    *       <Array of clm_id from Column>
    *   ],
    *   "device_id": <device_id from Device> or null for all devices, 0 - for all devices
    * }
    * -----------------------------------------------------------------
    * CONFIGURATION FOR TOGGLES
    * "configuration": {
    *   "clm_id": <clm_id from Column>,
    *   "write_enabled": true
    *   "device_id": <device_id from Device> or null for all devices, 0 - for all devices
    * }
    * -----------------------------------------------------------------
    * CONFIGURATION FOR GAUGES
    * "configuration": {
    *  "clm_id": <clm_id from Column>,
    *  "max_value": 100,
    *  "gauge_type": 1 or 2,
    *  "device_id": <device_id from Device> or null for all devices, 0 - for all devices
    * }
*/

/*
    * GET request for /api/widget?project_id=1
    * Returns all widgets for a project
    * @param {Number} project_id - The id of the project
    * @returns {Array} - An array of widgets
    * @throws {Error} - Throws an error (404) if the project does not exist
    * @throws {Error} - Throws an error (500) if there is a server error
*/
async function getWidgetsByProject(project_id, res) {
    try {
        const project = await Project.findByPk(project_id);
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        const widgets = await Widget.findAll({
            where: {
                project_id: project_id,
            },
            include: [{
                model: DataTable,
                attributes: ['tbl_name'],
            }]
        });

        let configurations = [];
        for (let widget of widgets) {
            let configuration = {};
            if (widget.widget_type == 1) {
                const chart_widget = await ChartWidget.findOne({
                    where: {
                        widget_id: widget.id,
                    },
                    include: [{
                        model: ChartSeries,
                    }]
                });

                configuration = chart_widget;
            } else if (widget.widget_type == 2) {
                const parameter_table_widget = await ParameterTableWidget.findAll({
                    where: {
                        widget_id: widget.id,
                    },
                    include: [{
                        model: Column,
                        attributes: ['clm_name'],
                    },
                    {
                        model: Device,
                        attributes: ['device_name'],
                    }]
                });

                configuration = parameter_table_widget;
            } else if (widget.widget_type == 3) {
                const toggle_widget = await ToggleWidget.findOne({
                    where: {
                        widget_id: widget.id,
                    },
                    include: [{
                        model: Column,
                        attributes: ['clm_name'],
                    },
                    {
                        model: Device,
                        attributes: ['device_name'],
                    }]
                });

                configuration = toggle_widget;
            } else if (widget.widget_type == 4) {
                const gauge_widget = await GaugeWidget.findOne({
                    where: {
                        widget_id: widget.id,
                    },
                    include: [{
                        model: Column,
                        attributes: ['clm_name'],
                    },
                    {
                        model: Device,
                        attributes: ['device_name'],
                    }]
                });

                configuration = gauge_widget;
            } else if (widget.widget_type == 5) {
                const metric_widget = await MetricWidget.findOne({
                    where: {
                        widget_id: widget.id,
                    },
                    include: [{
                        model: Column,
                        attributes: ['clm_name'],
                    },
                    {
                        model: Device,
                        attributes: ['device_name'],
                    }]
                });

                configuration = metric_widget;
            }
            widget.setDataValue('configuration', configuration);
        }

        res.status(200).json(widgets);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server error" });
    }
}

/*
    * GET request for /api/widget/:widgetId
    * Returns a widget by id
    * @param {Number} widget_id - The id of the widget
    * @returns {Object} - The widget object
    * Should include its configuration according to the widget type
    * @throws {Error} - Throws an error (404) if the widget does not exist
    * @throws {Error} - Throws an error (500) if there is a server error
*/
async function getWidgetById(widget_id, res) {
    try {
        const widget = await Widget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }

        let configuration = {};
        if (widget.widget_type == 1) {
            configuration = await ChartWidget.findOne({
                where: {
                    widget_id: widget_id,
                },
                include: [{
                    model: ChartSeries,
                }]
            });
        } else if (widget.widget_type == 2) {
            configuration = await ParameterTableWidget.findAll({
                where: {
                    widget_id: widget_id,
                },
                include: [{
                    model: Column,
                    attributes: ['clm_name'],
                },
                {
                    model: Device,
                    attributes: ['device_name'],
                }]
            });
        } else if (widget.widget_type == 3) {
            configuration = await ToggleWidget.findOne({
                where: {
                    widget_id: widget_id,
                },
                include: [{
                    model: Column,
                    attributes: ['clm_name'],
                },
                {
                    model: Device,
                    attributes: ['device_name'],
                }]
            });
        } else if (widget.widget_type == 4) {
            configuration = await GaugeWidget.findOne({
                where: {
                    widget_id: widget_id,
                },
                include: [{
                    model: Column,
                    attributes: ['clm_name'],
                },
                {
                    model: Device,
                    attributes: ['device_name'],
                }]
            });
        } else if (widget.widget_type == 5) {
            configuration = await MetricWidget.findOne({
                where: {
                    widget_id: widget_id,
                },
                include: [{
                    model: Column,
                    attributes: ['clm_name'],
                },
                {
                    model: Device,
                    attributes: ['device_name'],
                }]
            });
        }

        widget.setDataValue('configuration', configuration);
        res.status(200).json(widget);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server error" });
    }
}

/*
    * POST request for /api/widget
    * Creates a new widget
    * @param {Object} req.body - The widget object to create
    * Should add the widget's configuration according to its widget_type
    * @returns {Object} - The created widget object
    * @throws {Error} - Throws an error (404) if the project does not exist
    * @throws {Error} - Throws an error (500) if there is a server error
*/
async function createWidget(req, res) {
    let { widget_name, widget_type, dataset, project_id, configuration } = req.body;
    // Check if project exists and data table exists
    try {
        const project = await Project.findByPk(project_id);
        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        const data_table = await DataTable.findByPk(dataset);
        if (!data_table) {
            res.status(404).json({ message: "Data table not found" });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        return;
    }

    try {
        if (widget_type == 5) {
            if (!configuration || configuration.clm_id == null) {
                res.status(400).json({ message: "Metric widget requires a valid 'clm_id' in configuration" });
                return;
            }
            if (!configuration.measuring_unit || typeof configuration.measuring_unit !== 'string' || configuration.measuring_unit.length < 1 || configuration.measuring_unit.length > 4) {
                res.status(400).json({ message: "Metric widget requires 'measuring_unit' (1-4 chars)" });
                return;
            }

            const metricColumn = await Column.findByPk(configuration.clm_id);
            if (!metricColumn) {
                res.status(404).json({ message: "Column not found for the provided 'clm_id'" });
                return;
            }

            const allowedTypes = [1, 2, 4];
            if (!allowedTypes.includes(metricColumn.data_type)) {
                res.status(400).json({ message: "Metric widget requires numerical or boolean column (allowed data_type: 1, 2, or 4)" });
                return;
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        return;
    }

    // Validate configuration
    try {
        if (await validateConfiguration(widget_type, configuration) == false) {
            res.status(400).json({ message: "Invalid configuration" });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        return;
    }

    /*
        * START CREATING THE WIDGET AND ITS CONFIGURATION
        * Create the widget object and save it to the database
        * Use Sequelize transactions to ensure that the widget and its configuration are saved together
    */

    try {
        const widget = await sequelize.transaction(async (t) => {
            const new_widget = await Widget.create({
                widget_name,
                widget_type,
                dataset,
                project_id,
            }, { transaction: t });

            /*
                * Create widget configuration
            */
            let widget_configuration;
            if (widget_type == 1) {
                widget_configuration = await ChartWidget.create({
                    widget_id: new_widget.id,
                    chart_type: configuration.chart_type,
                    x_axis: configuration.x_axis,
                }, { transaction: t });

                for (let i = 0; i < configuration.series.length; i++) {
                    const series = configuration.series[i];
                    await ChartSeries.create({
                        chart_id: widget_configuration.id,
                        series_name: series.series_name,
                        clm_id: series.clm_id,
                        device_id: series.device_id,
                    }, { transaction: t });
                }
            } else if (widget_type == 2) {
                for (let i = 0; i < configuration.columns.length; i++) {
                    await ParameterTableWidget.create({
                        widget_id: new_widget.id,
                        clm_id: configuration.columns[i],
                        device_id: configuration.device_id,
                    }, { transaction: t });
                }
            } else if (widget_type == 3) {
                widget_configuration = await ToggleWidget.create({
                    widget_id: new_widget.id,
                    clm_id: configuration.clm_id,
                    write_enabled: configuration.write_enabled,
                    device_id: configuration.device_id,
                }, { transaction: t });
            } else if (widget_type == 4) {
                widget_configuration = await GaugeWidget.create({
                    widget_id: new_widget.id,
                    clm_id: configuration.clm_id,
                    min_value: configuration.min_value,
                    max_value: configuration.max_value,
                    gauge_type: configuration.gauge_type,
                    device_id: configuration.device_id,
                }, { transaction: t });
            } else if (widget_type == 5) {
                widget_configuration = await MetricWidget.create({
                    widget_id: new_widget.id,
                    clm_id: configuration.clm_id,
                    device_id: configuration.device_id,
                    measuring_unit: configuration.measuring_unit,
                }, { transaction: t });
            }

            new_widget.configuration = widget_configuration;
            return new_widget;
        });

        res.status(200).json(widget);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}

/*
    * PUT request for /api/widget/:widgetId
    * Updates a widget by id
    * @param {Number} widget_id - The id of the widget
    * @param {Object} req.body - The widget object to update
    * Should update the widget's configuration according to its widget_type
    * @returns {Object} - The updated widget object
    * @throws {Error} - Throws an error (404) if the widget does not exist
    * @throws {Error} - Throws an error (500) if there is a server error
*/
async function updateWidgetById(req, res) {
    let { widget_id, widget_name, widget_type, dataset, project_id, configuration } = req.body;

    // Check if widget exists
    try {
        const widget = await Widget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        return;
    }

    try {
        if (widget_type == 5) {
            if (!configuration || configuration.clm_id == null) {
                res.status(400).json({ message: "Metric widget requires a valid 'clm_id' in configuration" });
                return;
            }
            if (!configuration.measuring_unit || typeof configuration.measuring_unit !== 'string' || configuration.measuring_unit.length < 1 || configuration.measuring_unit.length > 4) {
                res.status(400).json({ message: "Metric widget requires 'measuring_unit' (1-4 chars)" });
                return;
            }

            const metricColumn = await Column.findByPk(configuration.clm_id);
            if (!metricColumn) {
                res.status(404).json({ message: "Column not found for the provided 'clm_id'" });
                return;
            }

            const allowedTypes = [1, 2, 4];
            if (!allowedTypes.includes(metricColumn.data_type)) {
                res.status(400).json({ message: "Metric widget requires numerical or boolean column (allowed data_type: 1, 2, or 4)" });
                return;
            }
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        return;
    }

    // Validate configuration
    try {
        if (await validateConfiguration(widget_type, configuration) == false) {
            res.status(400).json({ message: "Invalid configuration" });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
        return;
    }

    /*
        * START UPDATING THE WIDGET AND ITS CONFIGURATION
        * Update the widget object and its configuration in the database
        * Use Sequelize transactions to ensure that the widget and its configuration are updated together
    */

    try {
        const updated_widget = await sequelize.transaction(async (t) => {
            await Widget.update({
                widget_name,
                widget_type,
                dataset,
                project_id,
            }, {
                where: {
                    id: widget_id
                },
                transaction: t
            });

            /*
                * Update widget configuration
            */
            if (widget_type == 1) {
                const [rowsUpdate, [updatedChart]] = await ChartWidget.update({
                    chart_type: configuration.chart_type,
                    x_axis: configuration.x_axis,
                }, {
                    where: {
                        widget_id: widget_id
                    },
                    returning: true,
                    transaction: t
                });

                // Get existing series
                let oldSeries = await ChartSeries.findAll({
                    where: {
                        chart_id: updatedChart.id
                    },
                    transaction: t
                });

                // Create new series
                for (let i = 0; i < configuration.series.length; i++) {
                    const series = configuration.series[i];
                    await ChartSeries.create({
                        chart_id: updatedChart.id,
                        series_name: series.series_name,
                        clm_id: series.clm_id,
                        device_id: series.device_id,
                    }, { transaction: t });
                }

                // Delete existing series
                for (let oldSeriesItem of oldSeries) {
                    await oldSeriesItem.destroy({ transaction: t });
                }
            } else if (widget_type == 2) {
                // Get existing columns
                let oldColumns = await ParameterTableWidget.findAll({
                    where: {
                        widget_id: widget_id
                    },
                    transaction: t
                });

                // Create new columns
                for (let i = 0; i < configuration.columns.length; i++) {
                    await ParameterTableWidget.create({
                        widget_id: widget_id,
                        clm_id: configuration.columns[i],
                        device_id: configuration.device_id,
                    }, { transaction: t });
                }

                // Delete existing columns
                for (let oldColumn of oldColumns) {
                    await oldColumn.destroy({ transaction: t });
                }

            } else if (widget_type == 3) {
                await ToggleWidget.update({
                    clm_id: configuration.clm_id,
                    write_enabled: configuration.write_enabled,
                    device_id: configuration.device_id,
                }, {
                    where: {
                        widget_id: widget_id
                    },
                    transaction: t
                });
            } else if (widget_type == 4) {
                await GaugeWidget.update({
                    clm_id: configuration.clm_id,
                    min_value: configuration.min_value,
                    max_value: configuration.max_value,
                    gauge_type: configuration.gauge_type,
                    device_id: configuration.device_id,
                }, {
                    where: {
                        widget_id: widget_id
                    },
                    transaction: t
                });
            } else if (widget_type == 5) {
                await MetricWidget.update({
                    clm_id: configuration.clm_id,
                    device_id: configuration.device_id,
                    measuring_unit: configuration.measuring_unit,
                }, {
                    where: {
                        widget_id: widget_id
                    },
                    transaction: t
                });
            }
            return true;
        });

        if (!updated_widget) {
            res.status(500).json({ message: "Something Went Wrong" });
            return;
        } else {
            res.status(200).json({ message: "Widget Updated" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
}

/*
    * DELETE request for /api/widget/:widgetId
    * Deletes a widget by id
    * @param {Number} widget_id - The id of the widget
    * @returns {Object} - The deleted widget object
    * @throws {Error} - Throws an error (404) if the widget does not exist
    * @throws {Error} - Throws an error (500) if there is a server error
*/
async function deleteWidgetById(widget_id, res) {
    try {
        const widget = await Widget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }

        await widget.destroy();
        res.status(200).json("Widget Deleted");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server error" });
    }
}

/*
    * HELPER FUNCTION TO VALIDATE WIDGET CONFIGURATION
    * @param {Number} widget_type - The type of the widget
    * @param {Object} configuration - The configuration object of the widget
    * @returns {Boolean} - Returns true if the configuration is valid, false otherwise
    * The configuration object should be validated based on the widget type
    * The configuration object should have all required fields for the widget type
*/
async function validateConfiguration(widget_type, configuration) {
    if (widget_type == 1) {
        return validateChartConfiguration(configuration);
    } else if (widget_type == 2) {
        return validateParameterTableConfiguration(configuration);
    } else if (widget_type == 3) {
        return await validateToggleConfiguration(configuration);
    } else if (widget_type == 4) {
        return validateGaugeConfiguration(configuration);
    } else if (widget_type == 5) {
        return validateMetricConfiguration(configuration);
    }
}

/*
    * HELPER FUNCTION TO VALIDATE CHART CONFIGURATION
    * @param {Object} configuration - The configuration object of the chart widget
    * @returns {Boolean} - Returns true if the configuration is valid, false otherwise
    * The configuration object should have all required fields for a chart widget
    * The configuration object should have a valid chart type, x-axis, and series
    * The chart type should be between 1 and 4
    * The series should have at least one element
    * Each series element should have a series name, clm_id, and device
    * The clm_id and device should be valid
*/
async function validateChartConfiguration(configuration) {
    if (configuration.chart_type == null || configuration.series == null) {
        console.log("SOMETHING MISSING")
        return false;
    }

    if (configuration.chart_type < 1 || configuration.chart_type > 4) {
        console.log("INVALID CHART TYPE")
        return false;
    }

    if (configuration.series.length < 1) {
        console.log("NO SERIES")
        return false;
    }

    // Check if x-axis is valid
    if (configuration.x_axis != null) {
        if (await validateColumn(configuration.x_axis) == false) {
            console.log("INVALID X AXIS")
            return false;
        }
    }

    for (let i = 0; i < configuration.series.length; i++) {
        const series = configuration.series[i];
        if (series.series_name == null || series.clm_id == null) {
            console.log("SERIES MISSING")
            return false;
        }

        if (await validateColumn(series.clm_id) == false) {
            console.log("INVALID SERIES")
            return false;
        }

        if (series.device_id != null) {
            if (await validateDevice(series.device_id) == false) {
                console.log("INVALID DEVICE")
                return false;
            }
        }
    }

    return true;
}

/*
    * HELPER FUNCTION TO VALIDATE PARAMETER TABLE CONFIGURATION
    * @param {Object} configuration - The configuration object of the parameter table widget
    * @returns {Boolean} - Returns true if the configuration is valid, false otherwise
    * The configuration object should have all required fields for a parameter table widget
    * The configuration object should have columns and device
    * The columns should have at least one element
    * The columns should be valid
    * The device should be valid
*/
async function validateParameterTableConfiguration(configuration) {
    if (configuration.columns == null) {
        console.log("NO COLUMNS")
        return false;
    }

    if (configuration.columns.length < 1) {
        console.log("NO COLUMNS")
        return false;
    }

    // Check if columns are valid
    for (let i = 0; i < configuration.columns.length; i++) {
        if (await validateColumn(configuration.columns[i]) == false) {
            console.log("INVALID COLUMN")
            return false;
        }
    }

    // Check if device is valid
    if (configuration.device_id != null) {
        if (await validateDevice(configuration.device_id) == false) {
            console.log("INVALID DEVICE")
            return false;
        }
    }

    return true;
}

/*
    * HELPER FUNCTION TO VALIDATE TOGGLE CONFIGURATION
    * @param {Object} configuration - The configuration object of the toggle widget
    * @returns {Boolean} - Returns true if the configuration is valid, false otherwise
    * The configuration object should have all required fields for a toggle widget
    * The configuration object should have clm_id, write_enabled, and device
    * The clm_id and device should be valid
    * The write_enabled should be a boolean
*/
async function validateToggleConfiguration(configuration) {
    console.log(configuration.clm_id)
    if (configuration.clm_id == null || configuration.write_enabled == null) {
        console.log("MISSING FIELDS")
        return false;
    }

    // Check if clm_id is valid
    if (await validateColumn(configuration.clm_id) == false) {
        console.log("INVALID COLUMN")
        return false;
    }

    // Check if device is valid
    if (configuration.device_id != null) {
        if (await validateDevice(configuration.device_id) == false) {
            console.log("INVALID DEVICE")
            return false;
        }
    }

    return true;
}

/*
    * HELPER FUNCTION TO VALIDATE GAUGE CONFIGURATION
    * @param {Object} configuration - The configuration object of the gauge widget
    * @returns {Boolean} - Returns true if the configuration is valid, false otherwise
    * The configuration object should have all required fields for a gauge widget
    * The configuration object should have clm_id, max_value, gauge_type, and device
    * The clm_id and device should be valid
    * The max_value should be a number
    * The gauge_type should be between 1 and 2
*/
async function validateGaugeConfiguration(configuration) {
    if (configuration.clm_id == null || configuration.max_value == null || configuration.gauge_type == null) {
        console.log("MISSING FIELDS")
        return false;
    }

    if (configuration.gauge_type < 1 || configuration.gauge_type > 2) {
        console.log("INVALID GAUGE TYPE")
        return false;
    }

    // Check if clm_id is valid
    if (await validateColumn(configuration.clm_id) == false) {
        console.log("INVALID COLUMN")
        return false;
    }

    // Check if device is valid
    if (configuration.device_id != null) {
        if (await validateDevice(configuration.device_id) == false) {
            console.log("INVALID DEVICE")
            return false;
        }
    }

    return true;
}

/*
    * HELPER FUNCTION TO VALIDATE METRIC CONFIGURATION
    * @param {Number} device_id - The id of the device
    * @param {clm_id} clm_id - The id of the column
    * @returns {Boolean} - Returns true if the device and column are valid, false otherwise
    * The device and column should exist in the database
    * Should return true if both exist, false otherwise
    * Use the Device and Column models and findByPk to check if they exist
*/
function validateMetricConfiguration(configuration) {
    if (configuration.device_id == null || configuration.clm_id == null) {
        console.log("MISSING FIELDS")
        return false;
    }
    if (!configuration.measuring_unit || typeof configuration.measuring_unit !== 'string' || configuration.measuring_unit.length < 1 || configuration.measuring_unit.length > 4) {
        console.log("INVALID MEASURING UNIT")
        return false;
    }
    if(configuration.device_id <= 0) {
        console.log("INVALID DEVICE")
        return false;
    }
    if(configuration.clm_id <= 0) {
        console.log("INVALID COLUMN")
        return false;
    }

    return true;
}

/*
    * HELPER FUNCTION TO VALIDATE DEVICE
    * @param {Number} device_id - The id of the device
    * @returns {Boolean} - Returns true if the device is valid, false otherwise
    * The device should exist in the database
    * Should return true if the device exists, false otherwise
    * Use the Device model and findByPk to check if the device exists
    * Use a promise to handle the asynchronous operation
*/
async function validateDevice(device_id) {
    return await Device.findByPk(device_id)
        .then(device => device != null)
        .catch(() => false);
}

/*
    * HELPER FUNCTION TO VALIDATE COLUMN
    * @param {Number} clm_id - The id of the column
    * @returns {Boolean} - Returns true if the column is valid, false otherwise
    * The column should exist in the database
    * Should return true if the column exists, false otherwise
    * Use the Column model and findByPk to check if the column exists
    * Use a promise to handle the asynchronous operation
*/
async function validateColumn(clm_id) {
    return await Column.findByPk(clm_id)
        .then(column => column != null)
        .catch(() => false);
}

module.exports = {
    getWidgetsByProject,
    getWidgetById,
    createWidget,
    updateWidgetById,
    deleteWidgetById,
}