const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Registro de nuevos usuarios con datos básicos
router.post('/register', auth.register);

// Inicio de sesión con email y contraseña
router.post('/login', auth.login);

// Obtener información del usuario autenticado actual
router.get('/me', requireAuth, auth.me);

// Actualizar configuración del perfil (nombre, negocio, contraseña, tema)
router.put('/profile', requireAuth, auth.updateProfile);

module.exports = router;
