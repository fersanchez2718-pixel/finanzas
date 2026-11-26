const pool = require('../config/db');
const crypto = require('crypto');
const { sign } = require('../utils/jwt');

const hashPwd = (pwd) => crypto.createHash('sha256').update(pwd + '_fooderp_salt_2026').digest('hex');

// Registrar nueva cuenta con datos básicos
const register = async (req, res) => {
  try {
    const { nombre_completo, nombre_negocio, email, password } = req.body;

    if (!nombre_completo || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar tu nombre completo, correo electrónico y contraseña'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre_completo.trim();
    const cleanNegocio = (nombre_negocio || 'Mi Negocio de Comida').trim();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const [existentes] = await pool.query(
      'SELECT id_usuario FROM USUARIOS WHERE email = ?',
      [cleanEmail]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado. Por favor inicia sesión'
      });
    }

    // Generar username automático derivado del email
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    let finalUsername = baseUsername;
    const [userCheck] = await pool.query('SELECT id_usuario FROM USUARIOS WHERE username = ?', [finalUsername]);
    if (userCheck.length > 0) {
      finalUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const passwordHash = hashPwd(password);

    const [result] = await pool.query(
      `INSERT INTO USUARIOS 
        (nombre_completo, nombre_negocio, username, email, password_hash, rol, estado, tema_preferido) 
       VALUES (?, ?, ?, ?, ?, 'Administrador', 'Activo', 'nvidia-dark')`,
      [cleanNombre, cleanNegocio, finalUsername, cleanEmail, passwordHash]
    );

    const newUserId = result.insertId;

    const userPayload = {
      id_usuario: newUserId,
      nombre_completo: cleanNombre,
      nombre_negocio: cleanNegocio,
      username: finalUsername,
      email: cleanEmail,
      rol: 'Administrador',
      tema_preferido: 'nvidia-dark'
    };

    const token = sign(userPayload);

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente. Tu entorno está listo para comenzar en ceros.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al crear la cuenta' });
  }
};

// Iniciar sesión con email y contraseña
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Ingresa tu correo y contraseña'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = hashPwd(password);

    const [rows] = await pool.query(
      `SELECT 
        id_usuario, 
        nombre_completo, 
        COALESCE(nombre_negocio, 'FoodERP Restaurant') as nombre_negocio, 
        username, 
        email, 
        password_hash, 
        rol, 
        estado, 
        COALESCE(tema_preferido, 'nvidia-dark') as tema_preferido 
       FROM USUARIOS 
       WHERE email = ? OR username = ?`,
      [cleanEmail, cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No existe una cuenta registrada con este correo'
      });
    }

    const user = rows[0];

    if (user.password_hash !== passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

    if (user.estado === 'Suspendido') {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta se encuentra temporalmente suspendida'
      });
    }

    // Actualizar fecha de último acceso
    await pool.query('UPDATE USUARIOS SET ultimo_acceso = NOW() WHERE id_usuario = ?', [user.id_usuario]);

    const userPayload = {
      id_usuario: user.id_usuario,
      nombre_completo: user.nombre_completo,
      nombre_negocio: user.nombre_negocio,
      username: user.username,
      email: user.email,
      rol: user.rol,
      tema_preferido: user.tema_preferido
    };

    const token = sign(userPayload);

    res.json({
      success: true,
      message: `¡Bienvenido de nuevo, ${user.nombre_completo}!`,
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error interno al autenticar usuario' });
  }
};

// Obtener datos del usuario activo a partir del token
const me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id_usuario, 
        nombre_completo, 
        COALESCE(nombre_negocio, 'FoodERP Restaurant') as nombre_negocio, 
        username, 
        email, 
        rol, 
        estado, 
        COALESCE(tema_preferido, 'nvidia-dark') as tema_preferido,
        DATE_FORMAT(ultimo_acceso, '%Y-%m-%d %H:%i') as ultimo_acceso
       FROM USUARIOS 
       WHERE id_usuario = ?`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    console.error('Error en me:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar perfil' });
  }
};

// Actualizar perfil de usuario (nombre, negocio, correo, tema o contraseña)
const updateProfile = async (req, res) => {
  try {
    const { nombre_completo, nombre_negocio, email, tema_preferido, password } = req.body;

    if (!nombre_completo) {
      return res.status(400).json({
        success: false,
        message: 'El nombre completo es obligatorio'
      });
    }

    const userId = req.userId;

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }
      const newHash = hashPwd(password.trim());
      await pool.query(
        `UPDATE USUARIOS 
         SET nombre_completo = ?, nombre_negocio = ?, email = ?, tema_preferido = ?, password_hash = ?
         WHERE id_usuario = ?`,
        [nombre_completo.trim(), (nombre_negocio || '').trim(), (email || '').trim().toLowerCase(), tema_preferido || 'nvidia-dark', newHash, userId]
      );
    } else {
      await pool.query(
        `UPDATE USUARIOS 
         SET nombre_completo = ?, nombre_negocio = ?, email = ?, tema_preferido = ?
         WHERE id_usuario = ?`,
        [nombre_completo.trim(), (nombre_negocio || '').trim(), (email || '').trim().toLowerCase(), tema_preferido || 'nvidia-dark', userId]
      );
    }

    const [updatedRows] = await pool.query(
      `SELECT id_usuario, nombre_completo, COALESCE(nombre_negocio, 'FoodERP Restaurant') as nombre_negocio, username, email, rol, COALESCE(tema_preferido, 'nvidia-dark') as tema_preferido FROM USUARIOS WHERE id_usuario = ?`,
      [userId]
    );

    const updatedUser = updatedRows[0];
    const newToken = sign(updatedUser);

    res.json({
      success: true,
      message: 'Configuraciones de perfil actualizadas con éxito',
      token: newToken,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar perfil' });
  }
};

module.exports = {
  register,
  login,
  me,
  updateProfile
};
