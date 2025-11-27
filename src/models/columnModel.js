const { DataTypes, Model } = require('sequelize');
const sequelize = require('./../../db');
const Table = require('./dataTableModel');
const ColumnDataType = require('./columnDataTypeModel');

class Column extends Model { }

Column.init({

    clm_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    clm_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    data_type: {
        type: DataTypes.INTEGER,
        References: {
            Model: ColumnDataType,
            key: 'data_type'
        }
    },
    tbl_id: {
        type: DataTypes.INTEGER,
        References: {
            Model: Table,
            key: 'tbl_id'
        }
    },
    default_value: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    max_length: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'Column',
    schema: 'public',
    tableName: 'columns',
    timestamps: true,
    underscored: true,
}
);

module.exports = Column;

