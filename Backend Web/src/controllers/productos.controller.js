const pool = require('../config/db');

// Obtener platillos/productos disponibles para la venta
const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_producto, nombre_producto, descripcion, precio, estado FROM PRODUCTOS WHERE estado = "Disponible" ORDER BY nombre_producto ASC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar el menú de productos' });
  }
};

module.exports = { getProductos };

