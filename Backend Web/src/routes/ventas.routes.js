const express = require('express');
const router = express.Router();
const controller = require('../controllers/ventas.controller');

router.get('/', controller.getAll);
router.get('/reporte', controller.getReporte);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

