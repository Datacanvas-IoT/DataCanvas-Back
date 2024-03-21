const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db'); // Import the Sequelize instance
const Widget = require('./widgetModel');
const Column = require('./columnModel');

class Chart extends Model { }

Chart.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        chart_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        widget_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            References: {
                Model: Widget,
                key: 'widget_id',
            },
        },
        x_axis: {
            type: DataTypes.INTEGER,
            allowNull: false,
            References: {
                Model: Column,
                key: 'clm_id',
            },
        },
    },
    {
        sequelize, // Pass the initialized Sequelize instance
        modelName: 'Chart', // Set the model name
        schema: 'iot-on-earth-public', // Set the schema name (if applicable)
        tableName: 'charts', // Set the table name explicitly (optional)
        timestamps: true, // Enable timestamps (createdAt, updatedAt)
        underscored: true, // Use snake_case for column names
    }
);

module.exports = Chart;