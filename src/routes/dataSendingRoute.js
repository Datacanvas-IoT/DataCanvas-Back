const express = require('express');
const router = express.Router();
const DataSendingController = require('../controllers/dataSendingController');

// Get request to retrieve all data of a table with offset and limit
router.get('/all/', (req, res) => {
    const { tbl_id } = req.query;
    try {
        if (tbl_id) {
            DataSendingController.getAllDataOfATable(req, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK table | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})

//Get request to retrive the record count of a table
router.get('/count/', (req, res) => {
    const { tbl_id } = req.query;
    try {
        if (tbl_id) {
            DataSendingController.getCountOfTable(tbl_id, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK table | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})

//Get request to retrieve the count of data records of a project. 
// Get tbl_id s of all the tables of a project using given project_id and then get the count of each table using tables with names datatable_<tbl_id>
router.get('/count/project/', (req, res) => {
    const { project_id } = req.query;

    try {
        if (project_id) {
            DataSendingController.getRecordCountOfProject(project_id, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK project | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})

// Get request to retrieve the latest updated_at timestamp of all the tables of a project
router.get('/latest/project/', (req, res) => {
    const { project_id } = req.query;

    try {
        if (project_id) {
            DataSendingController.getLatestTimestampOfProject(project_id, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK project | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})

/*
    * Get request for the search function in front end
    * keyword and user_id is sent as a query parameter
    * Call searchWholeProject function of DataSendingController by passing the keyword, user_id and res as parameters
*/
router.get('/search/', (req, res) => {
    const { keyword, project_id } = req.query;
    try {
        if (keyword == null || project_id == null) {
            res.status(400).json({ error: 'Bad Request | CHECK keyword and project_id | Request validation unsuccessful' });
        } else {
            DataSendingController.searchWholeProject(keyword, project_id, res);
        }
    } catch (error) {
        console.error('Error searching data:', error);
        res.status(500).json({ message: 'Failed to search data' });
    }
})

/*
    * Get request retrieve data of a selected toggle widget
    * API Endpoint : <root>/api/data/get/toggle/<widget_id>
    * Validate whether the widget_id == null
    * If null, send a 400 response with bad request error message
    * If not, call getToggleData function of DataSendingController by passing widget_id and res as parameters
*/
router.get('/toggle/:widget_id', (req, res) => {
    const { widget_id } = req.params;

    try {
        if (widget_id) {
            DataSendingController.getToggleData(widget_id, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK widget_id | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})


/*
    * Get request retrieve data of a selected gauge widget
    * API Endpoint : <root>/api/data/get/gauge/<widget_id>
    * Validate whether the widget_id == null
    * If null, send a 400 response with bad request error message
    * If not, call getGaugeData function of DataSendingController by passing widget_id and res as parameters
*/
router.get('/gauge/:widget_id', (req, res) => {
    const { widget_id } = req.params;
    try {
        if (widget_id) {
            DataSendingController.getGaugeData(widget_id, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK widget_id | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})

/*
    * Get request retrieve data of a selected table widget
    * API Endpoint : <root>/api/data/get/table/<widget_id>
    * Validate whether the widget_id == null
    * If null, send a 400 response with bad request error message
    * If not, call getParameterTableData function of DataSendingController by passing widget_id and res as parameters
*/
router.get('/table/', (req, res) => {
    const { widget_id, offset, limit } = req.query;

    try {
        if (widget_id == null || offset == null || limit == null) {
            res.status(400).json({ error: 'Bad Request | CHECK widget_id | Request validation unsuccessful' });
        } else {
            DataSendingController.getParameterTableData(req, res);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

/*
    * Get request retrieve data of a selected chart widget
    * API Endpoint : <root>/api/data/get/chart/<widget_id>
    * Validate whether the widget_id == null
    * If null, send a 400 response with bad request error message
    * If not, call getChartData function of DataSendingController by passing widget_id and res as parameters
*/
router.get('/chart/:widget_id', (req, res) => {
    const { widget_id } = req.params;
    const { recordLimit } = req.query;

    try {
        if (widget_id) {
            if (recordLimit == null || recordLimit == undefined || recordLimit == '') {
                recordLimit = 1000;
            }
            DataSendingController.getChartData(widget_id, recordLimit, res);
        } else {
            res.status(400).json({ error: 'Bad Request | CHECK widget_id | Request validation unsuccessful' });
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ message: 'Failed to retrieve data' });
    }
})

module.exports = router;