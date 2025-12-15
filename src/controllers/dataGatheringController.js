const Table = require("../models/dataTableModel");
const Project = require("../models/projectModel");
const Devices = require("../models/deviceModel");
const Column = require("../models/columnModel");
const ColumnConstraint = require("../models/columnConstraintModel");
const Widget = require("../models/widgetModel");
const ToggleWidget = require("../models/toggleWidgetModel");
const sequelize = require("./../../db");
const { Transaction } = require("sequelize");

async function insertData(req, res) {
    /*
    * Request body should contain:
    * project_id: Project ID - INTEGER
    * fingerprint: Device fingerprint - STRING of 32 characters
    * table: Table name - STRING
    * data: Data to be inserted - JSON object
    * Sample data section
    * data: {
    *   "column1": "value1", - Data type of the value should match the data type of the column
    *   "column2": "value2", - Data type of the value should match the data type of the column
    *   "column3": "value3", - Data type of the value should match the data type of the column
    * }
    */
    const { project_id, fingerprint, table, data } = req.body;

    try {
        // Validate project_id, fingerprint and table
        const device_id = await validateDevice(fingerprint);
        const tbl_id = await validateTable(project_id, table);

        if (!await validateProject(project_id)) {
            res.status(404).json({ error: "Project not found | CHECK project_id" });
            return;
        }

        if (!device_id) {
            res.status(404).json({ error: "Device not found | CHECK fingerprint" });
            return;
        }
        if (!tbl_id) {
            res.status(404).json({ error: "Table not found | CHECK table name" });
            return;
        }

        /* 
        * Get all columns of the table
        * Structure of the columns object
        * columns: [
        *   {
                "clm_id": 40,
                "clm_name": "id",
                "data_type": 1,
                "tbl_id": 26,
                "default_value": null,
                "max_length": null,
                "constraints": [
                    {
                        "constraint_id": 1
                    },
                    {
                        "constraint_id": 4
                    }
                ]
            },
            {
                "clm_id": 42,
                "clm_name": "temperature_in",
                "data_type": 2,
                "tbl_id": 26,
                "default_value": "",
                "max_length": 0,
                "constraints": []
            },
        * ]
        */
        const columns = await getColumns(tbl_id);
        if (!columns) {
            res.status(404).json({ error: "Fields not found | CHECK table name" });
            return;
        }

        /* 
        * Check if all the columns in the data object are available in the columns list, if not, send bad request
        * All the columns in the columns list is not needed to be in the data object, but all the columns in the data object should be in the columns list
        * Also check if the data type of the value matches the data type of the column, if not, send bad request
        * Check the columns list and if there are any columns with constraints of constraint_id 2 (NOT NULL), check if the data object contains those columns, if not, send bad request
        * If any of the above conditions are not met, send bad request with the appropriate message and return
        * If there are extra columns in the data object that are not in the columns list, send bad request with the appropriate message and return
        * Data object looks like this
        * data: {
        *   "column1": "value1", - Data type of the value should match the data type of the column
        *   "column2": "value2", - Data type of the value should match the data type of the column
        *   "column3": "value3", - Data type of the value should match the data type of the column
        * }
        */
        let foundColumn = false
        for (let column in data) {
            console.log(column)
            if (column != 'created_at') {
                foundColumn = columns.find((clm) => { if (clm.clm_name == column) { return clm } else { return false } });

                // Check if the column is a system column
                if (foundColumn && foundColumn.is_system_column) {
                    res.status(400).json({ error: `Column ${column} is a system column and cannot be modified | CHECK column name` });
                    return;
                }

                if (!foundColumn) {
                    res.status(400).json({ error: `Column ${column} not found | CHECK column name` });
                    return;
                }

                // Check data type of the value
                if (!validateColumnDataType(foundColumn.data_type, data[column])) {
                    res.status(400).json({ error: `Data type of ${column} does not match | CHECK data type` });
                    return;
                }

                // Check max length of the value
                if (foundColumn.max_length != null && foundColumn.dataType == 2 && !validateColumnMaxLength(foundColumn.max_length, data[column])) {
                    res.status(400).json({ error: `Max length of ${column} exceeded | CHECK data length` });
                    return;
                }

                // Check if the column has auto increment and there is a value for the column
                // Check if the column has constraint of NOT NULL
                let foundColumnConstraints = JSON.stringify(foundColumn.constraints)
                foundColumnConstraints = JSON.parse(foundColumnConstraints)
                let autoIncrement = foundColumnConstraints.some((constraint) => {
                    return constraint.constraint_id === 1;
                });
                let notNull = foundColumnConstraints.some((constraint) => {
                    return constraint.constraint_id === 2;
                });

                if (autoIncrement) {
                    if (data[column] !== undefined) {
                        res.status(400).json({ error: `Column ${column} has auto increment | CHECK Column value should not be sent` });
                        return;
                    }
                } else {
                    if (notNull && !data[column] == null || data[column] == undefined) {
                        res.status(400).json({ error: `Column ${column} cannot be NULL | CHECK column value` });
                        return;
                    }
                }
            } else {
                if (!validateColumnDataType(5, data[column])) {
                    res.status(400).json({ error: `Data type of ${column} does not match | CHECK data type` });
                    return;
                }
            }

        }

        // Get all the columns from columns list that have constraint_id = 2
        let notNullColumns = columns.filter((clm) => {
            let notNull = clm.constraints.find((constraint) => { return constraint.constraint_id === 2; });
            let autoIncrement = clm.constraints.find((constraint) => { return constraint.constraint_id === 1; });
            if (!autoIncrement && notNull) {
                return clm;
            }
        });

        // Check if the data object contains all the columns that included in the notNullColumns list
        for (let clm of notNullColumns) {
            if (!data[clm.clm_name]) {
                res.status(400).json({ error: `Column ${clm.clm_name} cannot be NULL | CHECK column value` });
                return;
            }
        }

        // Insert data
        let insertData = `INSERT INTO "public"."datatable_${tbl_id}" (device,`;
        let values = ` VALUES (${device_id}, `;
        // Loop through the data object and create the insert query
        for (let column in data) {
            insertData += `${column},`;
            values += `'${data[column]}', `;
        }

        insertData = insertData.slice(0, -1) + ')';
        values = values.slice(0, -2) + ')';
        insertData += values;

        try {
            let result = await sequelize.query(insertData);
            res.status(200).json({ message: 'Data inserted successfully' });
            return;
        } catch (error) {
            console.error('Error inserting data:', error);
            res.status(500).json({ message: 'Failed to insert data | Something went wrong', error: error });
            return;
        }
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ message: 'Failed to insert data | Something went wrong' });
        return;
    }
}

async function updateData(req, res) {
    /*
        * Request body should contain:
        * project_id: Project ID - INTEGER
        * fingerprint: Device fingerprint - STRING of 32 characters
        * table: Table name - STRING
        * search_field: Field name - STRING
        * search_value: Field value -  Data type of the value should match the data type of the search_field column
        * data: Data to be inserted - JSON object
        * Sample data section
        * data: {
        *   "column1": "value1", - Data type of the value should match the data type of the column
        *   "column2": "value2", - Data type of the value should match the data type of the column
        *   "column3": "value3", - Data type of the value should match the data type of the column
        * }
    */

    const { project_id, fingerprint, table, search_field, search_value, data } = req.body;

    try {
        // Validate project_id, fingerprint and table
        const device_id = await validateDevice(fingerprint);
        const tbl_id = await validateTable(project_id, table);

        if (!await validateProject(project_id)) {
            res.status(404).json({ error: "Project not found | CHECK project_id" });
            return;
        }

        if (!device_id) {
            res.status(404).json({ error: "Device not found | CHECK fingerprint" });
            return;
        }
        if (!tbl_id) {
            res.status(404).json({ error: "Table not found | CHECK table name" });
            return;
        }

        /* 
        * Get all columns of the table
        * Structure of the columns object
        * columns: [
        *   {
                "clm_id": 40,
                "clm_name": "id",
                "data_type": 1,
                "tbl_id": 26,
                "default_value": null,
                "max_length": null,
                "constraints": [
                    {
                        "constraint_id": 1
                    },
                    {
                        "constraint_id": 4
                    }
                ]
            },
            {
                "clm_id": 42,
                "clm_name": "temperature_in",
                "data_type": 2,
                "tbl_id": 26,
                "default_value": "",
                "max_length": 0,
                "constraints": []
            },
        * ]
        */

        const columns = await getColumns(tbl_id);
        if (!columns) {
            res.status(404).json({ error: "Fields not found | CHECK table name" });
            return;
        }

        /* 
            * Check if all the columns in the data object are available in the columns list, if not, send bad request
            * All the columns in the columns list is not needed to be in the data object, but all the columns in the data object should be in the columns list
            * Also check if the data type of the value matches the data type of the column, if not, send bad request
            * Check the columns list and if there are any columns with constraints of constraint_id 2 (NOT NULL), check if the data object contains those columns, if not, send bad request
            * If any of the above conditions are not met, send bad request with the appropriate message and return
            * If there are extra columns in the data object that are not in the columns list, send bad request with the appropriate message and return
            * Data object looks like this
            * data: {
            *   "column1": "value1", - Data type of the value should match the data type of the column
            *   "column2": "value2", - Data type of the value should match the data type of the column
            *   "column3": "value3", - Data type of the value should match the data type of the column
            * }
        */

        /*
            * Check if the search_field and search_value matches above validations
        */
        let foundColumn = false
        foundColumn = columns.find(clm => clm.clm_name === search_field);

        if (!foundColumn) {
            res.status(400).json({ error: `Column ${search_field} not found | CHECK field name` });
            return;
        }

        if (!validateColumnDataType(foundColumn.data_type, search_value)) {
            res.status(400).json({ error: `Data type of search_value does not match | CHECK data type` });
            return;
        }

        foundColumn = false;
        // Validate other columns in data section        
        for (let column in data) {
            foundColumn = columns.find((clm) => { if (clm.clm_name == column) { return clm } else { return false } });

            // Check if the column is a system column
            if (foundColumn && foundColumn.is_system_column) {
                res.status(400).json({ error: `Column ${column} is a system column and cannot be modified | CHECK column name` });
                return;
            }

            if (!foundColumn) {
                res.status(400).json({ error: `Column ${column} not found | CHECK column name` });
                return;
            }

            // Check data type of the value
            if (!validateColumnDataType(foundColumn.data_type, data[column])) {
                res.status(400).json({ error: `Data type of ${column} does not match | CHECK data type` });
                return;
            }

            // Check max length of the value
            if (foundColumn.max_length != null && foundColumn.dataType == 2 && !validateColumnMaxLength(foundColumn.max_length, data[column])) {
                res.status(400).json({ error: `Max length of ${column} exceeded | CHECK data length` });
                return;
            }

            let foundColumnConstraints = JSON.stringify(foundColumn.constraints)
            foundColumnConstraints = JSON.parse(foundColumnConstraints)
            let autoIncrement = foundColumnConstraints.some((constraint) => {
                return constraint.constraint_id === 1;
            });
            let notNull = foundColumnConstraints.some((constraint) => {
                return constraint.constraint_id === 2;
            });

            if (autoIncrement) {
                if (data[column] !== undefined) {
                    res.status(400).json({ error: `Column ${column} has auto increment | CHECK Column value should not be sent` });
                    return;
                }
            } else {
                if (notNull && !data[column] == null || data[column] == undefined) {
                    res.status(400).json({ error: `Column ${column} cannot be NULL | CHECK column value` });
                    return;
                }
            }
        }

        // Get all the columns from columns list that have constraint_id = 2
        let notNullColumns = columns.filter((clm) => {
            let notNull = clm.constraints.find((constraint) => { return constraint.constraint_id === 2; });
            let autoIncrement = clm.constraints.find((constraint) => { return constraint.constraint_id === 1; });
            if (!autoIncrement && notNull) {
                return clm;
            }
        });

        /* 
            * Check that the data object contains those columns which are in notNullCOlumns (It is not needed to be so)
            * If available, check that the value is null
            * If null, send bad request with the appropriate message and return
        */

        for (let clm of notNullColumns) {
            for (let column in data) {
                if (clm.clm_name == column) {
                    if (data[clm.clm_name] == null || data[clm.clm_name] == undefined) {
                        res.status(400).json({ error: `Column ${clm.clm_name} cannot be NULL | CHECK column value` });
                        return;
                    }
                }
            }
        }

        // Update data
        let updateData = `UPDATE "public"."datatable_${tbl_id}" SET `;
        // Loop through the data object and create the update query
        for (let column in data) {
            updateData += `${column}='${data[column]}',`;
        }

        updateData = updateData.slice(0, -1) + ` WHERE ${search_field}='${search_value}'`;

        try {
            let result = await sequelize.query(updateData);
            res.status(200).json({ message: 'Data updated successfully' });
            return;
        } catch (error) {
            console.error('Error updating data:', error);
            res.status(500).json({ message: 'Failed to update data | Something went wrong', error: error });
            return;
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Failed to update data | Something went wrong' });
        return;
    }
}

async function deleteData(req, res) {
    /*
    * Request body should contain:
    * project_id: Project ID - INTEGER
    * fingerprint: Device fingerprint - STRING of 32 characters
    * table: Table name - STRING
    * data: Data to be deleted - JSON object
    * Sample data section
    * data: {
    *   "column1": "value1", - Data type of the value should match the data type of the column
    *   "column2": "value2", - Data type of the value should match the data type of the column
    *   "column3": "value3", - Data type of the value should match the data type of the column
    * }
    */
    const { project_id, fingerprint, table, search_field, search_value } = req.body;

    try {
        //check if the table exists
        const tbl_id = await validateTable(project_id, table);
        const device_id = await validateDevice(fingerprint);

        // validates if the project exists
        if (!await validateProject(project_id)) {
            res.status(404).json({ error: "Project not found | CHECK project_id" });
            return;
        }

        if (!tbl_id) {
            res.status(404).json({ error: "Table not found | CHECK table name" });
            return;
        }

        if (!device_id) {
            res.status(404).json({ error: "Device not found | CHECK fingerprint" });
        }

        const columns = await getColumns(tbl_id);

        if (!columns) {
            res.status(404).json({ error: "Fields not found | CHECK table name" });
            return;
        }

        const foundColumn = columns.find(clm => clm.clm_name === search_field);

        if (!foundColumn) {
            res.status(400).json({ error: `Column ${search_field} not found | CHECK field name` });
            return;
        }

        if (!validateColumnDataType(foundColumn.data_type, search_value)) {
            res.status(400).json({ error: `Data type of ${search_field} does not match | CHECK data type` });
            return;
        }

        //constructing the delete query
        let deleteData = `DELETE FROM "public"."datatable_${tbl_id}" WHERE ${search_field}='${search_value}'`;

        try {
            const result = await sequelize.query(deleteData);
            res.status(200).json({ message: 'Data deleted successfully' });
        } catch (error) {
            console.error('Error deleting data:', error);
            res.status(500).json({ message: 'Failed to delete data | Something went wrong', error: error });
        }
    }
    catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ message: 'Failed to delete data | Something went wrong' });
    }
}

/*
    * Extract widget_id and new_value from the request
    * Check if the widget_id is valid and available
    * Check if the new_value is valid true/false value
    * Get the widget details as like in getToggleData
    * Start a transaction and get the latest record from the relevant table with relevant filters
    * Update the record with the new_value
    * Commit the transaction
    * Send the response
    * If any error occurs, rollback the transaction and send the error response
    * If the widget_id is not valid, send a 404 response with the appropriate message
    * If the new_value is not valid, send a 400 response with the appropriate message
    * If any other error occurs, send a 500 response with the appropriate message
*/
async function updateToggleState(req, res) {
    const { widget_id, new_value } = req.body;

    try {
        if (widget_id == null || new_value == null || new_value == undefined) {
            res.status(400).json({ error: 'Bad Request : new_value is null' });
            return;
        }

        if (new_value != true && new_value != false) {
            res.status(400).json({ error: 'Bad Request : new_value should be true or false' });
            return;
        }

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

        try {
            await sequelize.transaction(async (t) => {
                const sql = `SELECT * FROM "public"."datatable_${widget.dataset}" WHERE device=${configuration.device_id} ORDER BY created_at DESC LIMIT 1`;
                const record = await sequelize.query(sql, { transaction: t });
                const updateSql = `UPDATE "public"."datatable_${widget.dataset}" SET ${configuration.Column.clm_name}=${new_value} WHERE device=${configuration.device_id} AND id=${record[0][0].id}`;
                await sequelize.query(updateSql, { transaction: t });
            });

            res.status(200).json({ message: "Data updated successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ message: 'Failed to update data' });
    }
}
// Check project_id is a valid and available project
const validateProject = async (project_id) => {
    try {
        let project = await Project.findOne({ where: { project_id } });

        if (!project) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking project_id:', error);
        return false;
    }
}

// Check fingerprint is from valid and available device
const validateDevice = async (fingerprint) => {
    try {
        let device = await Devices.findOne({ where: { fingerprint } });

        if (!device) {
            return false;
        }

        return device.device_id;
    } catch (error) {
        console.error('Error checking device:', error);
        return false;
    }
}

// Check table is a name from a valid and available table and return tbl_id
const validateTable = async (project, table) => {
    try {
        let tbl = await Table.findOne({ where: { tbl_name: table, project_id: project } });

        if (!tbl) {
            return false;
        }

        return tbl.tbl_id;
    } catch (error) {
        console.error('Error checking table:', error);
        return false;
    }
}

// Get all columns of a table
const getColumns = async (tbl_id) => {
    try {
        const columns = await Column.findAll({
            where: { tbl_id },
            attributes: {
                exclude: ['createdAt', 'updatedAt'] // Exclude timestamp columns
            },
            include: [
                {
                    model: ColumnConstraint,
                    as: 'constraints',
                    attributes: ['constraint_id'],
                }
            ]
        });

        if (!columns || columns.length == 0) {
            return false;
        }

        return columns;

    } catch (error) {
        console.error('Error getting columns:', error);
        return false;
    }
}

const validateColumnDataType = (dataType, data) => {
    /*
    * Data types
    * 1 - INTEGER
    * 2 - DOUBLE
    * 3 - STRING
    * 4 - BOOLEAN
    * 5 - TIMESTAMP in format 'YYYY-MM-DD HH:MM:SS'
    */
    if (data == null || data == undefined) {
        return true;
    }

    if (dataType == 1) {
        if (isNaN(data)) {
            data = parseInt(data);
            if (!Number.isInteger(data)) {
                return false;
            }
        }
    }
    else if (dataType == 2) {
        if (isNaN(data)) {
            return false;
        }
    }
    else if (dataType == 3) {
        if (typeof data != 'string') {
            return false;
        }
    } else if (dataType == 4) {
        if (data != true && data != false) {
            return false;
        }
    } else if (dataType == 5) {
        const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!timestampRegex.test(data)) {
            return false;
        }
    }


    return true;
}

const validateColumnMaxLength = (maxLength, data) => {
    if (data.length > maxLength) {
        return false;
    }

    return true;
}

module.exports = {
    insertData,
    deleteData,
    updateData,
    updateToggleState
};


