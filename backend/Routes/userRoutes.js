const express = require('express');
const router = express.Router();
const userController = require('../controller/userController'); // Path check kar lena

// 1. User Register karne ke liye
// URL: POST http://localhost:5000/api/user/register
router.post('/register', userController.register);

// 2. User Login karne ke liye (JWT Token nikalne ke liye)
// URL: POST http://localhost:5000/api/user/login
router.post('/login', userController.login);

module.exports = router;