const pool = require('../config/db');

// Obtener platillos/productos disponibles para la venta del usuario autenticado
const getProductos = async (req, res) => {
  try {
    const userId = req.userId;
    const [rows] = await pool.query(
      'SELECT id_producto, nombre_producto, descripcion, precio, estado FROM PRODUCTOS WHERE id_usuario = ? AND estado = "Disponible" ORDER BY nombre_producto ASC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar el menú de productos' });
  }
};

// Crear nuevo platillo/producto en el catálogo del usuario
const createProducto = async (req, res) => {
  try {
    const userId = req.userId;
    const { nombre_producto, descripcion, precio, estado } = req.body;

    if (!nombre_producto || precio === undefined) {
      return res.status(400).json({ success: false, message: 'Nombre y precio son requeridos' });
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      return res.status(400).json({ success: false, message: 'El precio debe ser un número válido' });
    }

    const [result] = await pool.query(
      'INSERT INTO PRODUCTOS (nombre_producto, descripcion, precio, estado, id_usuario) VALUES (?, ?, ?, ?, ?)',
      [nombre_producto.trim(), descripcion ? descripcion.trim() : '', precioNum, estado || 'Disponible', userId]
    );

    res.status(201).json({
      success: true,
      message: 'Platillo agregado al menú con éxito',
      data: {
        id_producto: result.insertId,
        nombre_producto: nombre_producto.trim(),
        descripcion: descripcion ? descripcion.trim() : '',
        precio: precioNum,
        estado: estado || 'Disponible'
      }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ success: false, message: 'Error al agregar platillo al menú' });
  }
};

module.exports = { getProductos, createProducto };
