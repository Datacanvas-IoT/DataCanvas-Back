const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db');
const Project = require('./projectModel');

class DataTable extends Model { }

DataTable.init({
    tbl_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    tbl_name: {
        type: DataTypes.STRING,
        allowNull: false,
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
    modelName: 'DataTable',
    schema: 'public',
    tableName: 'datatables',
    timestamps: true,
    underscored: true
}
);

DataTable.belongsTo(Project, {
    foreignKey: 'project_id',
    as: 'project',
});

module.exports = DataTable;