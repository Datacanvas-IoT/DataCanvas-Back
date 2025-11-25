const ColumnDataType = require('../models/columnDataTypeModel');
const Constraint = require('../models/ConstraintModel');

async function getAllDataTypes(req, res) {
    try {
        const dataTypes = await ColumnDataType.findAll();
        res.status(200).json(dataTypes);
    } catch (error) {
        console.error('Error getting data types:', error);
        res.status(500).json({ error: 'Failed to get data types' });
    }
}

async function getAllConstraints(req, res) {
    try {
        const constraints = await Constraint.findAll();
        res.status(200).json(constraints);
    } catch (error) {
        console.error('Error getting constraints:', error);
        res.status(500).json({ error: 'Failed to get constraints' });
    }
}

// Get data type using type_id and send response
async function getDataTypeById(type_id, res) {
    try {
        const dataType = await ColumnDataType.findOne({ where: { type_id } });
        res.status(200).json(dataType);
    } catch (error) {
        console.error('Error getting data type:', error);
        res.status(500).json({ error: 'Failed to get data type' });
    }
}

// Get column constraint using constraint_id and send response
async function getColumnConstraintById(constraint_id, res) {
    try {
        const constraint = await Constraint.findOne({ where: { constraint_id } });
        res.status(200).json(constraint);
    } catch (error) {
        console.error('Error getting  constraint:', error);
        res.status(500).json({ error: 'Failed to get  constraint' });
    }
}

module.exports = {
    getAllDataTypes,
    getAllConstraints,
    getDataTypeById,
    getColumnConstraintById
};