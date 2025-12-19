const Project = require("../models/projectModel");
const AnalyticWidget = require("../models/analyticWidgetModel");
const Column = require("../models/columnModel");

async function getAllAnalyticWidgets(project, res) {
    try {
        const availableProject = await Project.findByPk(project);
        if (!availableProject) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        const widgets = await AnalyticWidget.findAll({
            where: {
                project: project,
            },
        });

        res.status(200).json(widgets);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function getAnalyticWidget(widget_id, res) {
    try {
        const widget = await AnalyticWidget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }

        res.status(200).json(widget);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function createAnalyticWidget(project, widget_name, widget_type, dataset, parameter, device, res) {
    try {
        const availableProject = await Project.findByPk(project);
        if (!availableProject) {
            res.status(404).json({ message: "Project not found" });
            return;
        }

        const columnOfParameter = await Column.findByPk(parameter);
        if (!columnOfParameter) {
            res.status(404).json({ message: "Parameter not found" });
            return;
        }

        if(columnOfParameter.tbl_id != dataset) {
            console.log('Parameter does not belong to the specified dataset:', columnOfParameter.tbl_id, dataset);
            res.status(400).json({ message: "Parameter does not belong to the specified dataset" });
            return;
        }

        if((columnOfParameter.data_type != 1 && columnOfParameter.data_type != 2) || columnOfParameter.is_system_column) {
            console.log('Parameter data type is not suitable for analytic widget:', columnOfParameter.data_type, columnOfParameter.is_system_column);
            res.status(400).json({ message: "Parameter data type is not suitable for analytic widget" });
            return;
        }

        const widget = await AnalyticWidget.create({
            widget_name,
            widget_type,
            dataset,
            project,
            parameter,
            device,
            latest_value_timestamp: new Date(),
        });

        res.status(200).json(widget);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateAnalyticWidget(widget_id, widget_name, widget_type, dataset, project, parameter, device, res) {
    try {
        const widget = await AnalyticWidget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }

        await AnalyticWidget.update({
            widget_name,
            widget_type,
            dataset,
            parameter,
            device,
        }, {
            where: {
                id: widget_id,
            },
        });

        res.status(200).json(widget);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function updateAnalyticWidgetValue(widget_id, latest_value, res) {
    try {
        const widget = await AnalyticWidget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }

        await widget.update({
            latest_value,
            latest_value_timestamp: new Date(),
        });

        res.status(200).json(widget);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

}

async function deleteAnalyticWidget(widget_id, res) {
    try {
        const widget = await AnalyticWidget.findByPk(widget_id);
        if (!widget) {
            res.status(404).json({ message: "Widget not found" });
            return;
        }

        await widget.destroy();

        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    getAllAnalyticWidgets,
    getAnalyticWidget,
    createAnalyticWidget,
    updateAnalyticWidget,
    updateAnalyticWidgetValue,
    deleteAnalyticWidget,
};

