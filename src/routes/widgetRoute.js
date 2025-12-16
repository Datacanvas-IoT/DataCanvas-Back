const express = require('express');
const router = express.Router();
const WidgetController = require('../controllers/widgetController');

/*
    * GET request for /api/widget?project_id=1
    * Returns all widgets for a project
*/
router.get('/', (req, res) => {
    const project_id = req.query.project_id;
    try {
        if (!project_id) {
            res.status(400).json({ message: "Missing project_id" });
            return;
        } else {
            WidgetController.getWidgetsByProject(project_id, res);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get widgets" });
    }
});

/*
    * GET request for /api/widget/:widgetId
    * Returns a widget by id
*/
router.get('/:widget_id', (req, res) => {
    const widget_id = req.params.widget_id;

    try {
        if (widget_id == null) {
            res.status(400).json({ message: "Missing widget_id" });
            return;
        } else {
            WidgetController.getWidgetById(widget_id, res);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get widget" });
    }
});

/*
    * POST request for /api/widget
    * Creates a new widget
*/
router.post('/', (req, res) => {
    let { widget_name, widget_type, dataset, project_id, configuration } = req.body;

    if (widget_name == null || widget_type == null || dataset == null || project_id == null || configuration == null) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }

    widget_type = parseInt(widget_type);
    if (widget_type < 1 || widget_type > 5) {
        res.status(400).json({ message: "Invalid widget type" });
        return;
    }
    try {
        WidgetController.createWidget(req, res);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to create widget" });
    }
});

/*
    * PUT request for /api/widget/:widgetId
    * Updates a widget by id
*/
router.put('/', (req, res) => {
    let { widget_id, widget_name, widget_type, dataset, project_id, configuration } = req.body;

    if (widget_id == null || widget_name == null || widget_type == null || dataset == null || project_id == null || configuration == null) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }

    widget_type = parseInt(widget_type);
    if (widget_type < 1 || widget_type > 4) {
        res.status(400).json({ message: "Invalid widget type" });
        return;
    }

    try {
        WidgetController.updateWidgetById(req, res);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to update widget" });
    }
});

/*
    * DELETE request for /api/widget/:widgetId
    * Deletes a widget by id
*/
router.delete('/', (req, res) => {
    const widget_id = req.body.widget_id;

    try {
        if (widget_id == null) {
            res.status(400).json({ message: "Missing widget_id" });
            return;
        } else {
            WidgetController.deleteWidgetById(widget_id, res);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to delete widget" });
    }
});

module.exports = router;