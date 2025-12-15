const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');


// GET request for /api/user or /api/user?email=sample_email
router.get('/', (req, res) => {
    const email = req.query.email;

    try {
        if (email) {  // if email parameter is available, send user details related to that email
            UserController.getUsersByEmail(email, res);
        } else {  // If email parameter is not available, send all users
            UserController.getAllUsers(res);
        }
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// POST request for /api/user, and create a new user
router.post('/', (req, res) => {
    try {
        if (!req.body.email || !req.body.user_name || !req.body.access_token) {
            res.status(400).json({ message: 'Bad Request' });
        } else {
            UserController.addUser(req, res);
        }
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Failed to add user' });
    }
});

// PUT request for /api/user/:email, and update the user with the required email
router.put('/', (req, res) => {
    const email = req.body.email;

    try {
        if (email) {  // if email parameter is available
            UserController.updateUserByEmail(req, res);
        } else { // if email parameter is not available
            res.status(400).json({ message: 'Bad Request' });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE request for /api/user/:email, and delete the user with the required email
router.delete('/', (req, res) => {
    const email = req.body.email;
    try {
        if (email) {  // if email parameter is available, send user details related to that email
            UserController.deleteUserByEmail(email, res);
        } else {
            res.status(400).json({ message: 'Bad Request' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


module.exports = router;
