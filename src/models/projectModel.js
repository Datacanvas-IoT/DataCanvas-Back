const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db'); // Import the Sequelize instance
const User = require('./userModel');

class Project extends Model { }

Project.init(
  {
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    project_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'user_id',
      },
    },
    real_time_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    mqtt_key: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize, // Pass the initialized Sequelize instance
    modelName: 'Project', // Set the model name
    schema: 'public', // Set the schema name (if applicable)
    tableName: 'projects', // Set the table name explicitly (optional)
    timestamps: true, // Enable timestamps (createdAt, updatedAt)
    underscored: true, // Use snake_case for column names
  }
);

// Define the association
Project.belongsTo(User, {
  foreignKey: 'user_id', // This should match the field name in your Project model that references the User model
  as: 'user', // Alias for the association (optional, allows you to reference the association)
});

module.exports = Project;