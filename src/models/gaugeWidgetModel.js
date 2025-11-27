const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Column = require('./columnModel');
const Widget = require('./widgetModel');
const Device = require('./deviceModel');

class GaugeWidget extends Model { }

GaugeWidget.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    widget_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Widget,
            key: 'id'
        }
    },
    clm_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Column,
            key: 'clm_id'
        }
    },
    min_value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    max_value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
    },
    gauge_type: {
        type: DataTypes.INTEGER, // 1 for radial, 2 for linear
        allowNull: false,
    },
    device_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Device,
            key: 'device_id'
        }
    }
}, {
    sequelize,
    modelName: 'GaugeWidget',
    schema: 'public',
    tableName: 'gauges',
    timestamps: false,
    underscored: true
});

module.exports = GaugeWidget; 
