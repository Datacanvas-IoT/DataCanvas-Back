const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db'); // Import the Sequelize instance
const Project = require('./projectModel');

class AccessKey extends Model { }

AccessKey.init(
  {
    access_key_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    access_key_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Project,
        key: 'project_id',
      },
    },
    secret_access_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_access_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiration_date: {
      type: DataTypes.DATE,
    },
    access_key_last_use_time: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize, // Pass the initialized Sequelize instance
    modelName: 'AccessKey', // Set the model name
    schema: 'public', // Set the schema name (if applicable)
    tableName: 'accesskeys', // Set the table name explicitly
    timestamps: true, // Enable timestamps (createdAt, updatedAt)
    underscored: true, // Use snake_case for column names
  }
);

// Define the association
AccessKey.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

module.exports = AccessKey;
