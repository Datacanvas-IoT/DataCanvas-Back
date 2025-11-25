const Table = require("../models/dataTableModel");
const Project = require("../models/projectModel");
const Devices = require("../models/deviceModel");
const Column = require("../models/columnModel");
const Constraint = require("../models/ConstraintModel");
const ColumnConstraint = require("../models/columnConstraintModel");
const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("./../../db");
require("dotenv").config();

async function createTable(req, res) {
  const { tbl_name, project_id } = req.body;

  try {
    let project = await Project.findOne({ where: { project_id } });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
  } catch (error) {
    console.error("Error checking project_id:", error);
    res.status(500).json({ error: "Failed to check project ID" });
    return;
  }

  // Check tbl_name already exists
  try {
    let table = await Table.findOne({ where: { tbl_name: tbl_name, project_id: project_id } });

    if (table) {
      res.status(409).json({ message: "Table name already exists" });
      return;
    }
  } catch (error) {
    console.error("Error checking table name:", error);
    res.status(500).json({ error: "Failed to check table name" });
    return;
  }

  try {
    let table = await Table.create({ tbl_name, project_id });

    try {
      const column_id = await Column.create({
        clm_name: "id",
        data_type: 1,
        tbl_id: table.tbl_id,
      });
      const column_device = await Column.create({
        clm_name: "device",
        data_type: 1,
        tbl_id: table.tbl_id,
        default_value: -1,
      });

      let constraints = [1, 4];
      for (let i = 0; i < constraints.length; i++) {
        const constraint = await Constraint.findByPk(constraints[i]);
        if (constraint) {
          await ColumnConstraint.create({
            clm_id: column_id.clm_id,
            constraint_id: constraint.constraint_id,
          });
        }
      }
    } catch (error) {
      console.error("Error adding default columns:", error);
      await Table.destroy({ where: { tbl_id: table.tbl_id } });
      res.status(500).json({ error: "Failed to add default columns" });
      return;
    }

    let result = createRelations(table.tbl_id);

    if (result) {
      res.status(200).json(table);
    } else {
      console.error("Error creating relation :", error);
      await Table.destroy({ where: { tbl_id: table.tbl_id } });
      res.status(500).json({ error: "Failed to add default columns" });
    }
  } catch (error) {
    console.error("Error adding table:", error);
    res.status(500).json({ error: "Failed to add table" });
  }
}

async function getTablesByProjectId(project_id, res) {
  try {
    // Check if project exists
    let project = await Project.findOne({ where: { project_id } });

    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    let tables = await Table.findAll({ where: { project_id } });

    res.status(200).json(tables);
  } catch (error) {
    console.error("Error getting tables by project Id:", error);
    res.status(500).json({ error: "Failed to get tables by project Id" });
  }
}

async function getTableById(tbl_id, res) {
  try {
    let table = await Table.findOne({ where: { tbl_id } });
    if (table) {
      res.status(200).json(table);
    } else {
      res.status(404).json({ message: "Table not found" });
    }
  } catch (error) {
    console.error("Error getting table by id:", error);
    res.status(500).json({ error: "Failed to get table by id" });
  }
}

async function updateTable(req, res) {
  const { tbl_name, tbl_id } = req.body;

  try {
    let updatedTable = await Table.update({ tbl_name }, { where: { tbl_id } });
    if (updatedTable > 0) {
      res.status(200).json({ message: "Table updated successfully" });
    } else {
      res.status(404).json({ message: "Table not found" });
    }
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ error: "Failed to update table" });
  }
}

async function truncateTable(tbl_id, res) {
  let sql = `TRUNCATE TABLE "iot-on-earth-public"."datatable_${tbl_id}"`;

  try {
    let result = await sequelize.query(sql);

    if (result) {
      res.status(200).json({ message: "Table truncated successfully" });
    }
  } catch (error) {
    console.error("Error truncating table:", error);
    res.status(500).json({ error: "Failed to truncate table" });
  }
}

async function truncateAllTables(project_id, res) {
  try {
    const tables = await Table.findAll({ where: { project_id } });

    if (tables.length == 0) {
      res.status(404).json({ message: "Tables not found" });
    }

    await sequelize.transaction(async (t) => {
      for (let i = 0; i < tables.length; i++) {
        let sql = `TRUNCATE TABLE "iot-on-earth-public"."datatable_${tables[i].tbl_id}"`;
        try {
          let result = await sequelize.query(sql, { transaction: t });
        } catch (error) {
          console.error("Error truncating tables:", error);
          throw error; // This will cause the transaction to be rolled back
        }
      }
    });

    res.status(200).json({ message: "All tables truncated successfully" });
  } catch (error) {
    console.error("Transaction rolled back due to error:", error);
    res.status(500).json({ error: "Failed to truncate all tables" });
  }
}

async function deleteTable(tbl_id, res) {
  try {
    const deletedTable = await Table.destroy({ where: { tbl_id } });
    if (deletedTable > 0) {
      let sql = `DROP TABLE "iot-on-earth-public"."datatable_${tbl_id}"`;
      try {
        let result = await sequelize.query(sql);
        res.status(200).json({ message: "Table deleted successfully" });
      } catch (error) {
        console.error("Error deleting table:", error);
        res.status(202).json({ error: "Table deleted partially" });
      }
    } else {
      res.status(404).json({ message: "Table not found" });
    }
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ error: "Failed to delete table" });
  }
}

// Delete all tables of a project at once
async function deleteAllTable(project_id, res) {
  const tables = await Table.findAll({ where: { project_id } });

  const deletedTable = await Table.destroy({ where: { project_id } });
  try {
    if (deletedTable > 0) {
      for (let i = 0; i < tables.length; i++) {
        let sql = `DROP TABLE "iot-on-earth-public"."datatable_${tables[i].tbl_id}"`;
        try {
          let result = await sequelize.query(sql);
        } catch (error) {
          console.error("Error deleting tables:", error);
          continue;
        }
      }
      res.status(200).json({ message: "Table deleted successfully" });
    } else {
      res.status(404).json({ message: "Table not found" });
    }
  } catch (error) {
    console.error("Error deleting tables:", error);
    res.status(500).json({ error: "Failed to delete all tables" });
  }
}

async function createRelations(tbl_id) {
  /*
    Define a table using sequelize. table name should be datatable_<tbl_id>
    It should have 2 columns as id and device and data type of both tables should be integer
    id column should have constraints as primary key and auto increment
    device column should have default value as -1
    device column should have foreign key constraint to id column of device table
  */

  try {
    const tableName = `datatable_${tbl_id}`;
    const table = sequelize.define(
      tableName,
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        device: {
          type: DataTypes.INTEGER,
          defaultValue: -1,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }
      },
      {
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true,
        schema: "iot-on-earth-public",
        tableName: tableName,
      }
    );

    table.belongsTo(Devices, {
      foreignKey: `device`,
      targetKey: "device_id",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Synchronize table
    await table.sync({ force: true });

    return true;
  } catch (error) {
    console.error("Error creating relations:", error);
    return false;
  }
}

module.exports = {
  createTable,
  getTablesByProjectId,
  getTableById,
  updateTable,
  truncateTable,
  truncateAllTables,
  deleteTable,
  deleteAllTable,
};
