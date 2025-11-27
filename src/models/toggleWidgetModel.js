const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Column = require('./columnModel');
const Widget = require('./widgetModel');
const Device = require('./deviceModel');

class ToggleWidget extends Model { }

ToggleWidget.init({
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
    write_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false
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
    modelName: 'ToggleWidget',
    schema: 'public',
    tableName: 'toggles',
    timestamps: false,
    underscored: true
});

module.exports = ToggleWidget; 
