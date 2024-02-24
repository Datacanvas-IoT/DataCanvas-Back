const Table = require('../models/dataTableModel');
const Project = require('../models/projectModel');
require('dotenv').config();

async function createTable(req, res) {
    const { tbl_name, project_id, } = req.body;

    try {
        let project = await Project.findOne({ where: { project_id } });

        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }
    } catch (error) {  // If error, return error message
        console.error('Error checking project_id:', error);
        res.status(500).json({ error: 'Failed to check project ID' });
        return;
    }

    try {
        let table = await Table.create({ tbl_name, project_id });
        res.status(200).json(table);
    } catch (error) {
        console.error('Error adding table:', error);
        res.status(500).json({ error: 'Failed to add table' });
    }
}

async function getTablesByProjectId(project_id, res) {
    try {
        // Check if project exists
        let project = await Project.findOne({ where: { project_id } });

        if (!project) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        let tables = await Table.findAll({ where: { project_id } });

        res.status(200).json(tables);

    } catch (error) {
        console.error('Error getting tables by project Id:', error);
        res.status(500).json({ error: 'Failed to get tables by project Id' });
    }
}

async function getTableById(tbl_id, res) {
    try {
        let table = await Table.findOne({ where: { tbl_id } });
        if (table) {
            res.status(200).json(table);
        }
        else {
            res.status(404).json({ message: "Table not found" });
        }
    }
    catch (error) {
        console.error('Error getting table by id:', error);
        res.status(500).json({ error: 'Failed to get table by id' });
    }
}

async function updateTable(req, res) {
    const { tbl_name, tbl_id } = req.body;
    console.log(tbl_name, tbl_id);
    try {
        let updatedTable = await Table.update({ tbl_name }, { where: { tbl_id } });
        if (updatedTable > 0) {
            res.status(200).json({ message: "Table updated successfully" });
        }
        else {
            res.status(404).json({ message: "Table not found" });
        }
    }
    catch (error) {
        console.error('Error updating table:', error);
        res.status(500).json({ error: 'Failed to update table' });
    }
}

async function truncateTable(req, res) {
    res.status(200).json({ message: "Truncate table function not created yet" });
}


async function deleteTable(tbl_id, res) {
    const deletedTable = await Table.destroy({ where: { tbl_id } });
    try {
        if (deletedTable > 0) {
            res.status(200).json({ message: "Table deleted successfully" });
        } else {
            res.status(404).json({ message: "Table not found" });
        }
    } catch (error) {
        console.error('Error deleting table:', error);
        res.status(500).json({ error: 'Failed to delete table' });
    }
}

async function deleteAllTable(project_id, res) {
    const deletedTable = await Table.destroy({ where: { project_id } });
    try {
        if (deletedTable > 0) {
            res.status(200).json({ message: "Table deleted successfully" });
        } else {
            res.status(404).json({ message: "Table not found" });
        }
    } catch (error) {
        console.error('Error deleting tables:', error);
        res.status(500).json({ error: 'Failed to delete all tables' });
    }
}

module.exports = {
    createTable,
    getTablesByProjectId,
    getTableById,
    updateTable,
    truncateTable,
    deleteTable,
    deleteAllTable,
};

