const express = require('express');
const router = express.Router();
const controller = require('../controllers/inventario.controller');

router.get('/', controller.getInventario);
router.patch('/:id/ajuste', controller.ajustarStock);

module.exports = router;

