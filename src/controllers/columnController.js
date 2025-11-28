const ColumnConstraint = require('../models/columnConstraintModel');
const Column = require('../models/columnModel');
const Project = require('../models/projectModel');
const Table = require('../models/dataTableModel');
const Constraint = require('../models/ConstraintModel');
const sequelize = require("./../../db");
require('dotenv').config();

async function addColumn(req, res) {
  const { clm_name, data_type, tbl_id, default_value, max_length, constraints } = req.body;

  try {
    const table = await Table.findByPk(tbl_id);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    // Check for clm_name duplications for the table tbl_id
    const columnExists = await Column.findOne({ where: { clm_name, tbl_id } });
    if (columnExists) {
      res.status(409).json({ message: 'Column name already exists' });
      return;
    }

    const column = await Column.create({ clm_name, data_type, tbl_id, default_value, max_length });

    if (column) {
      if (constraints) {
        /*
          CONSTRAINTS ARE IN THIS TYPE
          constraints = [1,2,3] // array of constraint ids
          These should be added to ColumnConstraint table along with clm_id
        */
        try {
          for (let i = 0; i < constraints.length; i++) {
            const constraint = await Constraint.findByPk(constraints[i]);
            if (constraint) {
              await ColumnConstraint.create({ clm_id: column.clm_id, constraint_id: constraint.constraint_id });
            }
          }
        } catch (error) {
          // Rollback the column creation and added column constraints
          await column.destroy();
          //Rollback column constraints added with the column ID
          await ColumnConstraint.destroy({ where: { clm_id: column.clm_id } });
          // Send error response
          console.error('Error adding column constraints:', error);
          res.status(500).json({ error: 'Failed to add column' });
          return;
        }
      }

      /* 
        If the column is created succesfully, datatable_<tbl_id> should be altered to add the new column
      */
      try {
        let dataTypeString = '';
        let constraintList = '';

        // SET DATA TYPE
        if (data_type == 1) {
          dataTypeString = 'int';
        } else if (data_type == 2) {
          dataTypeString = 'real';
        } else if (data_type == 3) {
          dataTypeString = 'varchar';
          if (max_length) {
            dataTypeString += `(${max_length})`;
          }
        } else if (data_type == 4) {
          dataTypeString = 'boolean';
        }

        // SET CONSTRAINTS
        let isAutoIncrementing = false;
        for (let i = 0; i < constraints.length; i++) {
          switch (constraints[i]) {
            case 1:
              constraintList += ' SERIAL';
              isAutoIncrementing = true;
              break;
            case 2:
              constraintList += ' NOT NULL';
              break;
            case 3:
              constraintList += ' UNIQUE';
              break;
          }
        }

        let query = '';
        if (isAutoIncrementing) {
          query = `ALTER TABLE "public"."datatable_${tbl_id}" ADD COLUMN ${clm_name} ${constraintList};`;
        } else {
          if (default_value && default_value != null) {
            query = `ALTER TABLE "public"."datatable_${tbl_id}" ADD COLUMN ${clm_name} ${dataTypeString} DEFAULT '${default_value}'${constraintList};`;
          } else {
            query = `ALTER TABLE "public"."datatable_${tbl_id}" ADD COLUMN ${clm_name} ${dataTypeString}${constraintList};`;
          }
        }

        // Execute the query
        const [results, metadata] = await sequelize.query(query);
      } catch (error) {
        // Rollback the column creation and added column constraints
        await column.destroy();
        //Rollback column constraints added with the column ID
        await ColumnConstraint.destroy({ where: { clm_id: column.clm_id } });
        // Send error response
        console.error('Error adding column to datatable:', error);
        res.status(500).json({ error: 'Failed to add column' });
        return;
      }
      res.status(201).json(column);
    } else {
      res.status(500).json({ error: 'Failed to add column' });
    }
  } catch (error) {
    console.error('Error adding column:', error);
    res.status(500).json({ error: 'Failed to add column' });
  }
}

//get columns by table id          
async function getAllColumns(tbl_id, res) {
  // Check for table existence
  try {
    const table = await Table.findByPk(tbl_id);
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }
  } catch (error) {
    console.error('Error getting table by ID:', error);
    res.status(500).json({ error: 'Failed to get table' });
  }

  try {
    const columns = await Column.findAll({
      where: { tbl_id },
      attributes: {
        exclude: ['createdAt', 'updatedAt'] // Exclude timestamp columns
      },
      include: [
        {
          model: ColumnConstraint,
          as: 'constraints',
          attributes: ['constraint_id'],
        }
      ]
    });
    res.status(200).json(columns);
  } catch (error) {
    console.error('Error getting all columns:', error);
    res.status(500).json({ error: 'Failed to get columns of table' });
  }
}

//get columns by id    
async function getColumnById(clm_id, res) {
  try {
    const column = await Column.findByPk(clm_id, {
      attributes: {
        exclude: ['createdAt', 'updatedAt'] // Exclude timestamp columns
      },
      include: [
        {
          model: ColumnConstraint,
          as: 'constraints',
          attributes: ['constraint_id'],
        }
      ]
    });

    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    res.status(200).json(column);
  } catch (error) {
    console.error('error getting column by id:', error);
    res.status(500).json({ error: 'failed to get column' });
  }
}

async function getColumnsByProjectId(project_id, res) {
  try {
    const project = await Project.findByPk(project_id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
  } catch (error) {
    console.error('Error getting project by ID:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }

  try {
    const tables = await Table.findAll({
      where: { project_id },
      attributes: {
        exclude: ['createdAt', 'updatedAt'] // Exclude timestamp columns
      },
      include: [
        {
          model: Column,
          as: 'columns',
          attributes: {
            exclude: ['createdAt', 'updatedAt'] // Exclude timestamp columns
          },
        }
      ]
    });

    res.status(200).json(tables);
  } catch (error) {
    console.error('Error getting all columns:', error);
    res.status(500).json({ error: 'Failed to get columns of project' });
  }

}

//update the column by its ID
async function updateColumnById(req, res) {
  const { clm_id, clm_name, data_type, default_value, max_length, tbl_id } = req.body;

  try {
    const column = await Column.findByPk(clm_id);
    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }

    if (data_type != column.data_type) {
      res.status(405).json({ error: 'Data type cannot be changed' });
      return;
    }

    // Check for clm_name duplications for the table tbl_id
    const columnExists = await Column.findOne({ where: { clm_name, tbl_id } });
    if (columnExists) {
      res.status(409).json({ message: 'Column name already exists' });
      return;
    }

    const updatedColumn = await Column.update({ clm_name, default_value, max_length }, { where: { clm_id } });

    if (updatedColumn) {
      /*
        If the column is updated succesfully, datatable_<tbl_id> should be altered to change the column name, default_value and max_lengtb only if data_type=3. Data type is changing only if it is equal t 3
      */
      let renameSuccessful = false;
      try {
        let dataTypeString = '';

        // SET DATA TYPE
        if (data_type == 1) {
          dataTypeString = 'int';
        } else if (data_type == 2) {
          dataTypeString = 'real';
        } else if (data_type == 3) {
          dataTypeString = 'varchar';
          if (max_length) {
            dataTypeString += `(${max_length})`;
          }
        }

        let renameQuery = `ALTER TABLE "public"."datatable_${column.tbl_id}" RENAME COLUMN ${column.clm_name} TO ${clm_name};`;
        let query = '';
        if (default_value && default_value != null) {

          query = `ALTER TABLE "public"."datatable_${column.tbl_id}" ALTER COLUMN ${clm_name} TYPE ${dataTypeString} USING ${clm_name}::${dataTypeString}, ALTER COLUMN ${clm_name} SET DEFAULT '${default_value}';`;
        } else {
          query = `ALTER TABLE "public"."datatable_${column.tbl_id}" ALTER COLUMN ${clm_name} TYPE ${dataTypeString} USING ${clm_name}::${dataTypeString};`;
        }

        // Execute the query
        if (column.clm_name != clm_name) {
          const [results, metadata] = await sequelize.query(renameQuery);
          renameSuccessful = true;
        }

        const [results2, metadata2] = await sequelize.query(query);
      } catch (error) {
        console.error('Error updating column in datatable:', error);
        // Rollback the column update
        await Column.update({ clm_name: column.clm_name, default_value: column.default_value, max_length: column.max_length }, { where: { clm_id } });
        if (renameSuccessful) {
          let query = `ALTER TABLE "public"."datatable_${column.tbl_id}" RENAME COLUMN ${clm_name} TO ${column.clm_name};`;
          const [results, metadata] = sequelize.query
        }
        // Send error response
        res.status(500).json({ error: 'Failed to update column' });
        return;
      }

      res.status(200).json({ message: 'Column updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update column' });
    }
  } catch (error) {
    console.error('Error updating column by ID:', error);
    res.status(500).json({ error: 'Failed to update column' });
  }
}

//delete column
async function deleteColumnById(clm_id, res) {
  try {
    const column = await Column.findByPk(clm_id);
    if (!column) {
      res.status(404).json({ message: 'Column not found' });
      return;
    }
    await column.destroy();

    // Column Constraints will be automatically deleted due to on_update cascade
    /*
      If the column is deleted succesfully, datatable_<tbl_id> should be altered to remove the column
    */
    try {
      let query = `ALTER TABLE "public"."datatable_${column.tbl_id}" DROP COLUMN ${column.clm_name};`;
      const [results, metadata] = await sequelize.query(query);
    } catch (error) {
      // Rollback the column deletion
      await Column.create({ clm_name: column.clm_name, data_type: column.data_type, tbl_id: column.tbl_id, default_value: column.default_value, max_length: column.max_length });
      // Send error response
      console.error('Error deleting column from datatable:', error);
      res.status(500).json({ error: 'Failed to delete column' });
      return;
    }

    res.status(200).json({ message: 'Column deleted successfully' });
  } catch (error) {
    console.error('Error deleting column by ID:', error);
    res.status(500).json({ error: 'Failed to delete column' });
  }

}

module.exports = {
  getAllColumns,
  getColumnById,
  getColumnsByProjectId,
  addColumn,
  updateColumnById,
  deleteColumnById
};
