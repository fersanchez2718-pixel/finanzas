const express = require('express');
const router = express.Router();
const controller = require('../controllers/productos.controller');

router.get('/', controller.getProductos);
router.post('/', controller.createProducto);

module.exports = router;
