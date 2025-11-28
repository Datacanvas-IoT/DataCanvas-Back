const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Column = require('./columnModel');
const Widget = require('./widgetModel');
const Device = require('./deviceModel');

class ParameterTableWidget extends Model { }

ParameterTableWidget.init({
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
        References: {
            Model: Device,
            key: 'device_id',
        },
    },
}, {
    sequelize,
    modelName: 'ParameterTableWidget',
    schema: 'public',
    tableName: 'parametertables',
    timestamps: false,
    underscored: true
});

module.exports = ParameterTableWidget; 
