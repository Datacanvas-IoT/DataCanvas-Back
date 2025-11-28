const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../db');
const Column = require('./columnModel');
const Constraint = require('./ConstraintModel');

class ColumnConstraint extends Model { }

ColumnConstraint.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    clm_id: {
        type: DataTypes.INTEGER,
        References: {
            Model: Column,
            key: 'clm_id'
        }
    },
    constraint_id: {
        type: DataTypes.INTEGER,
        References: {
            Model: Constraint,
            key: 'constraint_id'
        }
    }
}, {
    sequelize,
    modelName: 'ColumnConstraint',
    schema: 'public',
    tableName: 'columnconstraint',
    timestamps: true,
    underscored: true
}
);

module.exports = ColumnConstraint;
