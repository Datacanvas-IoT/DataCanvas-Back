const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db'); // Import the Sequelize instance
const AccessKey = require('./accessKeyModel');

class AccessKeyDomain extends Model { }

AccessKeyDomain.init(
  {
    access_key_domain_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    access_key_domain_name: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
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
    modelName: 'AccessKeyDomain', // Set the model name
    schema: 'public', // Set the schema name (if applicable)
    tableName: 'accesskeydomains', // Set the table name explicitly
    timestamps: false, // Disable timestamps
    underscored: true, // Use snake_case for column names
  }
);

// Define the association
AccessKeyDomain.belongsTo(AccessKey, {
  foreignKey: 'access_key_id',
  as: 'accessKey',
});

module.exports = AccessKeyDomain;
