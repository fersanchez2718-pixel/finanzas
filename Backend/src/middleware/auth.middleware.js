const { verify } = require('../utils/jwt');
const pool = require('../config/db');

// Middleware obligatorio de autenticación
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado: debes iniciar sesión'
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = verify(token);

    if (!payload || !payload.id_usuario) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada. Por favor ingresa nuevamente'
      });
    }

    req.userId = payload.id_usuario;
    req.user = payload;
    next();
  } catch (error) {
    console.error('Error en middleware auth:', error);
    res.status(500).json({ success: false, message: 'Error de verificación de credenciales' });
  }
};

// Middleware opcional (permite requests autenticados o resuelve id por defecto para compatibilidad)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verify(token);
      if (payload && payload.id_usuario) {
        req.userId = payload.id_usuario;
        req.user = payload;
        return next();
      }
    }

    // Fallback de compatibilidad: si no hay token, resolver a la cuenta principal (Fernando Ramírez)
    const [rows] = await pool.query('SELECT id_usuario FROM USUARIOS WHERE email = ? LIMIT 1', ['fernandoramirez@gmail.com']);
    if (rows.length > 0) {
      req.userId = rows[0].id_usuario;
    } else {
      req.userId = 1;
    }
    next();
  } catch (error) {
    req.userId = 1;
    next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth
};
