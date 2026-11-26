const pool = require('../config/db');
const crypto = require('crypto');

// Función de hashing seguro
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + '_fooderp_salt_2026').digest('hex');
};

// Obtener todos los usuarios con resumen analítico
const getAll = async (req, res) => {
  try {
    const { rol, estado, busqueda } = req.query;

    let query = `
      SELECT 
        id_usuario,
        nombre_completo,
        username,
        email,
        COALESCE(rol, 'Cajero') as rol,
        COALESCE(estado, 'Activo') as estado,
        DATE_FORMAT(ultimo_acceso, '%Y-%m-%d %H:%i') as ultimo_acceso,
        DATE_FORMAT(created_at, '%Y-%m-%d') as fecha_registro
      FROM usuarios
      WHERE 1=1
    `;
    const params = [];

    if (rol && rol !== 'Todos') {
      query += ' AND rol = ?';
      params.push(rol);
    }

    if (estado && estado !== 'Todos') {
      query += ' AND estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      query += ' AND (nombre_completo LIKE ? OR username LIKE ? OR email LIKE ?)';
      const term = `%${busqueda}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY id_usuario ASC';

    const [rows] = await pool.query(query, params);

    // Contadores de roles y estados
    const desgloseRoles = {};
    let usuariosActivos = 0;

    rows.forEach(u => {
      if (u.estado === 'Activo') usuariosActivos++;
      if (!desgloseRoles[u.rol]) desgloseRoles[u.rol] = 0;
      desgloseRoles[u.rol]++;
    });

    res.json({
      success: true,
      resumen: {
        totalUsuarios: rows.length,
        usuariosActivos,
        desgloseRoles
      },
      data: rows
    });
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar usuarios' });
  }
};

// Registrar un nuevo usuario
const create = async (req, res) => {
  try {
    const { nombre_completo, username, email, password, rol, estado } = req.body;

    if (!nombre_completo || !username || !email || !password || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar nombre, nombre de usuario, correo, contraseña y rol'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Validar si username o email ya existen
    const [existentes] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario o correo ya se encuentra registrado'
      });
    }

    const passwordHash = hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO usuarios 
        (nombre_completo, username, email, password_hash, rol, estado) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nombre_completo.trim(),
        cleanUsername,
        cleanEmail,
        passwordHash,
        rol,
        estado || 'Activo'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      id_usuario: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el usuario' });
  }
};

// Actualizar datos de usuario (nombre, email, rol, estado o reset password)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, rol, estado, password } = req.body;

    if (!nombre_completo || !email || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, correo y rol son campos obligatorios'
      });
    }

    const [existente] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (password && password.trim().length > 0) {
      const passwordHash = hashPassword(password.trim());
      await pool.query(
        `UPDATE usuarios 
         SET nombre_completo = ?, email = ?, rol = ?, estado = ?, password_hash = ?
         WHERE id_usuario = ?`,
        [nombre_completo.trim(), email.trim().toLowerCase(), rol, estado || 'Activo', passwordHash, id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios 
         SET nombre_completo = ?, email = ?, rol = ?, estado = ?
         WHERE id_usuario = ?`,
        [nombre_completo.trim(), email.trim().toLowerCase(), rol, estado || 'Activo', id]
      );
    }

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar el usuario' });
  }
};

// Eliminar usuario
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existente] = await pool.query('SELECT id_usuario, rol FROM usuarios WHERE id_usuario = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);

    res.json({
      success: true,
      message: 'Cuenta de usuario eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al eliminar el usuario' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};

