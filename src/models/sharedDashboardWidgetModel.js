const { DataTypes } = require("sequelize");
const sequelize = require("../../db");

/**
 * Junction table model for many-to-many relationship between SharedDashboard and Widget.
 * This ensures referential integrity - when a widget is deleted, the corresponding
 * shared_dashboard_widgets records are automatically deleted via CASCADE.
 */
const SharedDashboardWidget = sequelize.define(
  "SharedDashboardWidget",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    share_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shared_dashboards',
        key: 'share_id',
      },
    },
    widget_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'widgets',
        key: 'id',
      },
    },
  },
  {
    tableName: "shared_dashboard_widgets",
    schema: "public",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Only track created_at
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['share_id', 'widget_id'],
        name: 'unique_share_widget',
      },
    ],
  }
);

module.exports = SharedDashboardWidget;
