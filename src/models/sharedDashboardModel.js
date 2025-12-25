const { DataTypes } = require("sequelize");
const { sequelize } = require("../../db");

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
    allowed_widget_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
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
