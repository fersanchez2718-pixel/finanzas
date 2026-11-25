const pool = require('../config/db');
const crypto = require('crypto');

// Función de hashing seguro
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + '_fooderp_salt_2026').digest('hex');
};

// Verificar si el usuario autenticado tiene privilegios de Super Administrador
const checkIsSuperAdmin = async (userId) => {
  if (!userId) return false;
  try {
    const [rows] = await pool.query('SELECT email, rol FROM USUARIOS WHERE id_usuario = ?', [userId]);
    if (rows.length === 0) return false;
    return rows[0].email === 'fernandoramirez@gmail.com' || rows[0].rol === 'SuperAdmin';
  } catch (e) {
    return false;
  }
};

// Obtener usuarios con resumen analítico (SuperAdmin ve todos; Administrador regular ve solo su perfil/sub-usuarios)
const getAll = async (req, res) => {
  try {
    const isSuperAdmin = await checkIsSuperAdmin(req.userId);
    const { rol, estado, busqueda } = req.query;

    let query = `
      SELECT 
        id_usuario,
        nombre_completo,
        COALESCE(nombre_negocio, 'Restaurante / Negocio') as nombre_negocio,
        username,
        email,
        COALESCE(rol, 'Administrador') as rol,
        COALESCE(estado, 'Activo') as estado,
        COALESCE(tema_preferido, 'nvidia-dark') as tema_preferido,
        DATE_FORMAT(ultimo_acceso, '%Y-%m-%d %H:%i') as ultimo_acceso,
        DATE_FORMAT(created_at, '%Y-%m-%d') as fecha_registro
      FROM USUARIOS
      WHERE 1=1
    `;
    const params = [];

    // Si NO es SuperAdmin, aislar para que un usuario común no vea cuentas de otros dueños
    if (!isSuperAdmin) {
      query += ' AND id_usuario = ?';
      params.push(req.userId);
    }

    if (rol && rol !== 'Todos') {
      query += ' AND rol = ?';
      params.push(rol);
    }

    if (estado && estado !== 'Todos') {
      query += ' AND estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      query += ' AND (nombre_completo LIKE ? OR username LIKE ? OR email LIKE ? OR nombre_negocio LIKE ?)';
      const term = `%${busqueda}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY id_usuario ASC';

    const [rows] = await pool.query(query, params);

    // Contadores de roles y estados
    const desgloseRoles = {};
    let usuariosActivos = 0;
    let usuariosSuspendidos = 0;

    rows.forEach(u => {
      if (u.estado === 'Activo') usuariosActivos++;
      if (u.estado === 'Suspendido') usuariosSuspendidos++;
      if (!desgloseRoles[u.rol]) desgloseRoles[u.rol] = 0;
      desgloseRoles[u.rol]++;
    });

    res.json({
      success: true,
      isSuperAdmin,
      resumen: {
        totalUsuarios: rows.length,
        usuariosActivos,
        usuariosSuspendidos,
        desgloseRoles
      },
      data: rows
    });
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar usuarios' });
  }
};

// Registrar un nuevo usuario (SuperAdmin o Administrador)
const create = async (req, res) => {
  try {
    const isSuperAdmin = await checkIsSuperAdmin(req.userId);
    const { nombre_completo, nombre_negocio, username, email, password, rol, estado } = req.body;

    if (!nombre_completo || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar nombre, correo y contraseña'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username ? username.trim().toLowerCase() : cleanEmail.split('@')[0];
    const cleanNombre = nombre_completo.trim();
    const cleanNegocio = (nombre_negocio || 'Mi Negocio de Comida').trim();

    // Validar si username o email ya existen
    const [existentes] = await pool.query(
      'SELECT id_usuario FROM USUARIOS WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario o correo ya se encuentra registrado'
      });
    }

    const passwordHash = hashPassword(password);
    // Nuevas cuentas registradas son 'Administrador' por defecto
    const finalRole = isSuperAdmin && rol ? rol : 'Administrador';

    const [result] = await pool.query(
      `INSERT INTO USUARIOS 
        (nombre_completo, nombre_negocio, username, email, password_hash, rol, estado, tema_preferido) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'nvidia-dark')`,
      [
        cleanNombre,
        cleanNegocio,
        cleanUsername,
        cleanEmail,
        passwordHash,
        finalRole,
        estado || 'Activo'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Cuenta registrada exitosamente',
      id_usuario: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el usuario' });
  }
};

// Actualizar datos de usuario (nombre, negocio, email, rol, estado o reset password)
const update = async (req, res) => {
  try {
    const isSuperAdmin = await checkIsSuperAdmin(req.userId);
    const { id } = req.params;
    const { nombre_completo, nombre_negocio, email, rol, estado, password } = req.body;

    // Si no es SuperAdmin, solo puede editar su propio perfil
    if (!isSuperAdmin && String(id) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para modificar esta cuenta' });
    }

    if (!nombre_completo || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo y correo son campos obligatorios'
      });
    }

    const [existente] = await pool.query('SELECT id_usuario, email, rol FROM USUARIOS WHERE id_usuario = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Proteger cuenta maestra de Fernando para que no sea cambiada de rol ni suspendida
    const isTargetFernando = existente[0].email === 'fernandoramirez@gmail.com';
    const finalRole = isTargetFernando ? 'SuperAdmin' : (rol || existente[0].rol);
    const finalEstado = isTargetFernando ? 'Activo' : (estado || 'Activo');

    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      }
      const passwordHash = hashPassword(password.trim());
      await pool.query(
        `UPDATE USUARIOS 
         SET nombre_completo = ?, nombre_negocio = ?, email = ?, rol = ?, estado = ?, password_hash = ?
         WHERE id_usuario = ?`,
        [nombre_completo.trim(), (nombre_negocio || 'Restaurante').trim(), email.trim().toLowerCase(), finalRole, finalEstado, passwordHash, id]
      );
    } else {
      await pool.query(
        `UPDATE USUARIOS 
         SET nombre_completo = ?, nombre_negocio = ?, email = ?, rol = ?, estado = ?
         WHERE id_usuario = ?`,
        [nombre_completo.trim(), (nombre_negocio || 'Restaurante').trim(), email.trim().toLowerCase(), finalRole, finalEstado, id]
      );
    }

    res.json({
      success: true,
      message: 'Cuenta actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar el usuario' });
  }
};

// Alternar estado de la cuenta (Activo / Suspendido) - Exclusivo SuperAdmin
const toggleEstado = async (req, res) => {
  try {
    const isSuperAdmin = await checkIsSuperAdmin(req.userId);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo SuperAdmin puede suspender o activar cuentas' });
    }

    const { id } = req.params;
    const [existente] = await pool.query('SELECT id_usuario, email, estado FROM USUARIOS WHERE id_usuario = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (existente[0].email === 'fernandoramirez@gmail.com') {
      return res.status(400).json({ success: false, message: 'La cuenta maestra de Fernando Ramírez no puede ser suspendida' });
    }

    const nuevoEstado = existente[0].estado === 'Activo' ? 'Suspendido' : 'Activo';
    await pool.query('UPDATE USUARIOS SET estado = ? WHERE id_usuario = ?', [nuevoEstado, id]);

    res.json({
      success: true,
      message: `La cuenta ahora se encuentra ${nuevoEstado}`,
      nuevoEstado
    });
  } catch (error) {
    console.error('Error al alternar estado:', error);
    res.status(500).json({ success: false, message: 'Error interno al cambiar estado de la cuenta' });
  }
};

// Eliminar usuario - Exclusivo SuperAdmin
const remove = async (req, res) => {
  try {
    const isSuperAdmin = await checkIsSuperAdmin(req.userId);
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado: solo SuperAdmin puede eliminar cuentas' });
    }

    const { id } = req.params;

    const [existente] = await pool.query('SELECT id_usuario, email, rol FROM USUARIOS WHERE id_usuario = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (existente[0].email === 'fernandoramirez@gmail.com') {
      return res.status(400).json({ success: false, message: 'La cuenta principal de Fernando Ramírez está protegida y no puede eliminarse' });
    }

    await pool.query('DELETE FROM USUARIOS WHERE id_usuario = ?', [id]);

    res.json({
      success: true,
      message: 'Cuenta de usuario eliminada correctamente de la plataforma'
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
  toggleEstado,
  remove
};
