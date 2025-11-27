const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db');
const Project = require('./projectModel');

class Device extends Model { }

Device.init({
    device_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    device_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
    },
    fingerprint: {
        type: DataTypes.STRING,
        allowNull: false
    },
    project_id: {
        type: DataTypes.INTEGER,
        References: {
            Model: Project,
            key: 'project_id'
        }
    }
}, {
    sequelize,
    modelName: 'Device',
    schema: 'public',
    tableName: 'devices',
    timestamps: true,
    underscored: true
}
);

Device.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project',
});

module.exports = Device;