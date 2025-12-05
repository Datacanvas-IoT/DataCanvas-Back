const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db'); // Import the Sequelize instance
const Device = require('./deviceModel');
const AccessKey = require('./accessKeyModel');

class ProjectDevice extends Model { }

ProjectDevice.init(
  {
    project_device_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    device_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Device,
        key: 'device_id',
      },
    },
    access_key_id: {
      type: DataTypes.INTEGER,
      references: {
        model: AccessKey,
        key: 'access_key_id',
      },
    },
  },
  {
    sequelize, // Pass the initialized Sequelize instance
    modelName: 'ProjectDevice', // Set the model name
    schema: 'public', // Set the schema name (if applicable)
    tableName: 'projectdevices', // Set the table name explicitly
    timestamps: false, // Disable timestamps
    underscored: true, // Use snake_case for column names
  }
);

// Define the associations
ProjectDevice.belongsTo(Device, {
  foreignKey: 'device_id',
  as: 'device',
});

ProjectDevice.belongsTo(AccessKey, {
  foreignKey: 'access_key_id',
  as: 'accessKey',
});

module.exports = ProjectDevice;
