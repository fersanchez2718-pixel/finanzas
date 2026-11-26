const express = require('express');
const router = express.Router();
const controller = require('../controllers/nomina.controller');

// Resumen ejecutivo
router.get('/resumen', controller.getResumenNomina);

// Empleados
router.get('/empleados', controller.getEmpleados);
router.post('/empleados', controller.createEmpleado);
router.put('/empleados/:id', controller.updateEmpleado);
router.delete('/empleados/:id', controller.removeEmpleado);

// Pagos de nómina
router.get('/pagos', controller.getPagos);
router.post('/pagar', controller.createPago);
router.delete('/pagos/:id', controller.removePago);

module.exports = router;

