const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db'); // Import the Sequelize instance
const DataTable = require('./dataTableModel');

class Widget extends Model { }

Widget.init(
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
    },
    {
        sequelize, // Pass the initialized Sequelize instance
        modelName: 'Widget', // Set the model name
        schema: 'iot-on-earth-public', // Set the schema name (if applicable)
        tableName: 'widgets', // Set the table name explicitly (optional)
        timestamps: true, // Enable timestamps (createdAt, updatedAt)
        underscored: true, // Use snake_case for column names
    }
);

module.exports = Widget;