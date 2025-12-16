const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Column = require('./columnModel');
const Widget = require('./widgetModel');
const Device = require('./deviceModel');

class MetricWidget extends Model { }

MetricWidget.init({
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
    device_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Device,
            key: 'device_id'
        }
    },
    measuring_unit: {
        type: DataTypes.STRING(4),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'MetricWidget',
    schema: 'public',
    tableName: 'metrics',
    timestamps: false,
    underscored: true
});

module.exports = MetricWidget; 
