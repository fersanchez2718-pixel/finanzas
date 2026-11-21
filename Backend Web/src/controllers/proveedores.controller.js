const pool = require('../config/db');

// Obtener todos los proveedores del usuario
const getAll = async (req, res) => {
  try {
    const userId = req.userId;
    const { categoria, estado, busqueda } = req.query;

    let query = `
      SELECT 
        id_proveedor,
        nombre_comercial,
        COALESCE(razon_social, '') as razon_social,
        COALESCE(contacto_nombre, '') as contacto_nombre,
        telefono,
        COALESCE(email, '') as email,
        COALESCE(direccion, '') as direccion,
        categoria_suministro,
        COALESCE(dias_entrega, 'Bajo Pedido') as dias_entrega,
        COALESCE(estado, 'Activo') as estado,
        COALESCE(notas, '') as notas,
        created_at
      FROM PROVEEDORES
      WHERE id_usuario = ?
    `;
    const params = [userId];

    if (categoria && categoria !== 'Todas') {
      query += ' AND categoria_suministro = ?';
      params.push(categoria);
    }

    if (estado && estado !== 'Todos') {
      query += ' AND COALESCE(estado, "Activo") = ?';
      params.push(estado);
    }

    if (busqueda) {
      query += ' AND (nombre_comercial LIKE ? OR contacto_nombre LIKE ? OR telefono LIKE ? OR categoria_suministro LIKE ?)';
      const term = `%${busqueda}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY nombre_comercial ASC';

    const [rows] = await pool.query(query, params);

    // Métricas para la vista
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_proveedores,
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as proveedores_activos,
        COUNT(DISTINCT categoria_suministro) as total_categorias
       FROM PROVEEDORES
       WHERE id_usuario = ?`,
      [userId]
    );

    res.json({
      success: true,
      resumen: stats[0] || { total_proveedores: 0, proveedores_activos: 0, total_categorias: 0 },
      data: rows
    });
  } catch (error) {
    console.error('Error al consultar proveedores:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar directorio de proveedores' });
  }
};

// Registrar nuevo proveedor
const create = async (req, res) => {
  try {
    const userId = req.userId;
    const { nombre_comercial, razon_social, contacto_nombre, telefono, email, direccion, categoria_suministro, dias_entrega, estado, notas } = req.body;

    if (!nombre_comercial || !telefono || !categoria_suministro) {
      return res.status(400).json({
        success: false,
        message: 'El nombre comercial, teléfono y categoría de suministro son obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO PROVEEDORES 
        (nombre_comercial, razon_social, contacto_nombre, telefono, email, direccion, categoria_suministro, dias_entrega, estado, notas, id_usuario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_comercial.trim(),
        razon_social ? razon_social.trim() : null,
        contacto_nombre ? contacto_nombre.trim() : null,
        telefono.trim(),
        email ? email.trim() : null,
        direccion ? direccion.trim() : null,
        categoria_suministro.trim(),
        dias_entrega ? dias_entrega.trim() : 'Bajo Pedido',
        estado || 'Activo',
        notas ? notas.trim() : null,
        userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente en el directorio',
      id_proveedor: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el proveedor' });
  }
};

// Actualizar proveedor
const update = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { nombre_comercial, razon_social, contacto_nombre, telefono, email, direccion, categoria_suministro, dias_entrega, estado, notas } = req.body;

    if (!nombre_comercial || !telefono || !categoria_suministro) {
      return res.status(400).json({
        success: false,
        message: 'Nombre comercial, teléfono y categoría son requeridos'
      });
    }

    const [existente] = await pool.query('SELECT id_proveedor FROM PROVEEDORES WHERE id_proveedor = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    await pool.query(
      `UPDATE PROVEEDORES 
       SET nombre_comercial = ?, razon_social = ?, contacto_nombre = ?, telefono = ?, email = ?, direccion = ?, categoria_suministro = ?, dias_entrega = ?, estado = ?, notas = ?
       WHERE id_proveedor = ? AND id_usuario = ?`,
      [
        nombre_comercial.trim(),
        razon_social ? razon_social.trim() : null,
        contacto_nombre ? contacto_nombre.trim() : null,
        telefono.trim(),
        email ? email.trim() : null,
        direccion ? direccion.trim() : null,
        categoria_suministro.trim(),
        dias_entrega ? dias_entrega.trim() : 'Bajo Pedido',
        estado || 'Activo',
        notas ? notas.trim() : null,
        id,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'Ficha del proveedor actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar proveedor' });
  }
};

// Eliminar proveedor
const remove = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const [existente] = await pool.query('SELECT id_proveedor FROM PROVEEDORES WHERE id_proveedor = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    await pool.query('DELETE FROM PROVEEDORES WHERE id_proveedor = ? AND id_usuario = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Proveedor eliminado del directorio'
    });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ success: false, message: 'Error interno al eliminar el proveedor' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};
