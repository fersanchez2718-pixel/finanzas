const pool = require('../config/db');

// Obtener estado general del inventario para el usuario autenticado
const getInventario = async (req, res) => {
  try {
    const userId = req.userId;
    const { busqueda, estado } = req.query;
    let query = 'SELECT * FROM materia_prima WHERE id_usuario = ?';
    const params = [userId];

    if (busqueda) {
      query += ' AND nombre LIKE ?';
      params.push(`%${busqueda}%`);
    }

    if (estado && estado !== 'Todos') {
      query += ' AND estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY cantidad_disponible ASC, id_materia_prima DESC';

    const [rows] = await pool.query(query, params);

    // Calcular KPIs
    const totalInsumos = rows.length;
    let valorTotal = 0;
    let stockCritico = 0;
    let totalUnidades = 0;

    const articulosConNivel = rows.map(item => {
      const cantidad = parseFloat(item.cantidad_disponible);
      const costo = parseFloat(item.costo_unitario);
      const subtotal = cantidad * costo;

      valorTotal += subtotal;
      totalUnidades += cantidad;
      if (item.estado === 'Stock Bajo' || item.estado === 'Agotado') {
        stockCritico++;
      }

      // Nivel visual de capacidad (referencia estándar de 25 unidades como stock ideal)
      const stockIdeal = 25;
      const porcentaje = Math.min(Math.round((cantidad / stockIdeal) * 100), 100);

      return {
        ...item,
        valor_inventario: subtotal,
        porcentaje_stock: porcentaje
      };
    });

    res.json({
      success: true,
      resumen: {
        totalInsumos,
        valorTotal,
        stockCritico,
        totalUnidades
      },
      data: articulosConNivel
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar el inventario' });
  }
};

// Ajustar existencias de stock
const ajustarStock = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { tipo_ajuste, cantidad, motivo } = req.body;

    const cantNum = parseFloat(cantidad);
    if (isNaN(cantNum) || cantNum < 0) {
      return res.status(400).json({ success: false, message: 'La cantidad debe ser un número positivo válido' });
    }

    const [rows] = await pool.query('SELECT * FROM materia_prima WHERE id_materia_prima = ? AND id_usuario = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insumo no encontrado' });
    }

    const actual = rows[0];
    let nuevaCantidad = parseFloat(actual.cantidad_disponible);

    if (tipo_ajuste === 'fijar') {
      nuevaCantidad = cantNum;
    } else if (tipo_ajuste === 'sumar') {
      nuevaCantidad += cantNum;
    } else if (tipo_ajuste === 'restar') {
      nuevaCantidad = Math.max(0, nuevaCantidad - cantNum);
    } else {
      return res.status(400).json({ success: false, message: 'Tipo de ajuste no reconocido (fijar, sumar, restar)' });
    }

    // Calcular estado
    let nuevoEstado = 'Disponible';
    if (nuevaCantidad <= 0) {
      nuevoEstado = 'Agotado';
    } else if (nuevaCantidad <= 5) {
      nuevoEstado = 'Stock Bajo';
    }

    await pool.query(
      'UPDATE materia_prima SET cantidad_disponible = ?, estado = ? WHERE id_materia_prima = ? AND id_usuario = ?',
      [nuevaCantidad, nuevoEstado, id, userId]
    );

    res.json({
      success: true,
      message: `Stock ajustado correctamente. Nuevo saldo: ${nuevaCantidad} ${actual.unidad_medida}`,
      data: {
        id_materia_prima: actual.id_materia_prima,
        nombre: actual.nombre,
        cantidad_anterior: parseFloat(actual.cantidad_disponible),
        nueva_cantidad: nuevaCantidad,
        unidad_medida: actual.unidad_medida,
        estado: nuevoEstado,
        motivo: motivo || 'Ajuste manual de inventario'
      }
    });
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el stock en la base de datos' });
  }
};

module.exports = {
  getInventario,
  ajustarStock
};
