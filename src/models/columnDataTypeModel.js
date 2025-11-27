const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');

class ColumnDataType extends Model { }

ColumnDataType.init({
    type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    type_name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    sequelize,
    modelName: 'ColumnDataType',
    schema: 'public',
    tableName: 'datatypes',
    timestamps: false,
    underscored: true
}
);

module.exports = ColumnDataType;


