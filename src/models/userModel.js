const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db'); // Import the Sequelize instance

class User extends Model {}

User.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the initialized Sequelize instance
    modelName: 'User', // Set the model name
    schema: 'public', // Set the schema name (if applicable)
    tableName: 'users', // Set the table name explicitly (optional)
    timestamps: true, // Enable timestamps (createdAt, updatedAt)
    underscored: true, // Use snake_case for column names
  }
);

module.exports = User;
