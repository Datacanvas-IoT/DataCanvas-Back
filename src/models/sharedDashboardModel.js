const { DataTypes } = require("sequelize");
const sequelize = require("../../db");

/**
 * SharedDashboard model - stores public share links for dashboards.
 * Widget associations are now managed through the SharedDashboardWidget junction table
 * for proper referential integrity and cascade deletion.
 */
const SharedDashboard = sequelize.define(
  "SharedDashboard",
  {
    share_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    share_token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    share_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "shared_dashboards",
    schema: "public",
    timestamps: true,
    underscored: true,
  }
);

module.exports = SharedDashboard;
