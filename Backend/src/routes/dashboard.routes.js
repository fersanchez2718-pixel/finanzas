const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller');

router.get('/balance', controller.getBalance);

module.exports = router;

