const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db'); // Import the Sequelize instance
const Device = require('./deviceModel');
const AccessKey = require('./accessKeyModel');

class AccessKeyDevice extends Model { }

AccessKeyDevice.init(
  {
    access_key_device_id: {
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
    modelName: 'AccessKeyDevice', // Set the model name
    schema: 'public', // Set the schema name (if applicable)
    tableName: 'accesskeydevices', // Set the table name explicitly
    timestamps: false, // Disable timestamps
    underscored: true, // Use snake_case for column names
  }
);

// Define the associations
AccessKeyDevice.belongsTo(Device, {
  foreignKey: 'device_id',
  as: 'device',
});

AccessKeyDevice.belongsTo(AccessKey, {
  foreignKey: 'access_key_id',
  as: 'accessKey',
});

module.exports = AccessKeyDevice;
