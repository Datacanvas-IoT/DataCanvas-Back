const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db'); // Import the Sequelize instance
const DataTable = require('./dataTableModel');
const Project = require('./projectModel');
const Column = require('./columnModel');
const Device = require('./deviceModel');

class AnalyticWidget extends Model { }

AnalyticWidget.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        widget_name: {
            type: DataTypes.STRING,
            maxLength: 50,
            allowNull: false,
        },
        widget_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dataset: {
            type: DataTypes.INTEGER,
            allowNull: false,
            References: {
                Model: DataTable,
                key: 'tbl_id',
            },
        },
        project: {
            type: DataTypes.INTEGER,
            allowNull: false,
            References: {
                Model: Project,
                key: 'project_id',
            },
        },
        parameter: {
            type: DataTypes.INTEGER,
            allowNull: false,
            References: {
                Model: Column,
                key: 'clm_id',
            },
        },
        device: {
            type: DataTypes.INTEGER,
            allowNull: false,
            References: {
                Model: Device,
                key: 'device_id',
            },
        },
        latest_value: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0,
        },
        latest_value_timestamp: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize, // Pass the initialized Sequelize instance
        modelName: 'AnalyticWidget', // Set the model name
        schema: 'public', // Set the schema name (if applicable)
        tableName: 'analyticwidgets', // Set the table name explicitly (optional)
        timestamps: false, // Enable timestamps (createdAt, updatedAt)
        underscored: true, // Use snake_case for column names
    }
);

module.exports = AnalyticWidget;