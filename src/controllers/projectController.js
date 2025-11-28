const Project = require('../models/projectModel');
const User = require('../models/userModel');
const DataTable = require('../models/dataTableModel');
const sequelize = require("./../../db");
require('dotenv').config();

async function getProjectsByUserId(user_id, res) {
    try {
        // Check if user exists
        let user = await User.findOne({ where: { user_id } });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        let projects = await Project.findAll({ where: { user_id } });

        res.status(200).json(projects);

    } catch (error) {
        console.error('Error getting projects by user_id:', error);
        res.status(500).json({ error: 'Failed to get projects by user' });
    }
}

async function getProjectById(project_id, res) {
    try {
        let project = await Project.findOne({ where: { project_id } });

        if (project) {
            res.status(200).json(project);
        }
        else {
            res.status(404).json({ message: "Project not found" });
        }


    } catch (error) {
        console.error('Error getting project by id:', error);
        res.statu(500).json({ error: 'Failed to get project by id' })
    }
}


async function addProject(req, res) {
    const { project_name, user_id, description, real_time_enabled } = req.body;

    // Check user_id available using User Model
    try {
        let user = await User.findOne({ where: { user_id } });

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
    } catch (error) {
        console.error('Error checking user_id:', error);
        res.status(500).json({ error: 'Failed to check user ID' });
        return;
    }

    try {
        let mqtt_key = await generateFingerprint();
        if (!mqtt_key) {
            res.status(500).json({ error: 'Failed to create project' });
            return;
        }
        console.log(mqtt_key);
        let project = await Project.create({ project_name, user_id, description, real_time_enabled, mqtt_key });
        res.status(200).json(project);
    } catch (error) {
        console.error('Error adding project:', error);
        res.status(500).json({ error: 'Failed to add project' });
    }
}

async function updateProjectById(req, res) {
    const { project_id, project_name, description, real_time_enabled } = req.body;

    try {
        let updatedRowCount = await Project.update({ project_name, description, real_time_enabled }, { where: { project_id } });

        if (updatedRowCount > 0) {
            res.status(200).json({ message: "Project updated successfully" });
        } else {
            res.status(404).json({ message: "Project not found" });
        }

    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
}

async function deleteProjectById(project_id, res) {
    try {
        await sequelize.transaction(async (t) => {
            // Get all tbl_id from DataTable where project_id = project_id
            const dataTables = await DataTable.findAll({ where: { project_id }, transaction: t });

            const deletedRowCount = await Project.destroy({ where: { project_id }, transaction: t });

            // Seek (use for each loop) the DataTables and call sql query to drop a table with the name `public"."datatable_${tbl_id}
            for (let tbl of dataTables) {
                let sql = `DROP TABLE "public"."datatable_${tbl.tbl_id}"`;
                try {
                    await sequelize.query(sql, { transaction: t });
                } catch (error) {
                    console.error('Error dropping table:', error);
                    throw new Error('Failed to drop table');
                }
            }

            if (deletedRowCount > 0) {
                res.status(200).json({ message: "Project deleted successfully" });
            }
            else {
                res.status(404).json({ message: "Project not found" });
            }
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
}

// Genrate fingerprint
async function generateFingerprint() {
    let mqtt_key = "";
    let projectWithSameFingerprint = false;

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    do {
        for (let i = 0; i < 32; i++) {
            mqtt_key += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        try {
            projectWithSameFingerprint = await Project.findOne({ where: { mqtt_key } });
        } catch (error) {
            console.error('Error checking mqtt key:', error);
            return false;
        }

    } while (projectWithSameFingerprint);

    return mqtt_key;
}

module.exports = {
    getProjectsByUserId,
    getProjectById,
    addProject,
    updateProjectById,
    deleteProjectById,
};