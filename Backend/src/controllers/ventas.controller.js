const pool = require('../config/db');

// Obtener todas las ventas con su desglose de platillos para el usuario
const getAll = async (req, res) => {
  try {
    const userId = req.userId;
    const { fecha_inicio, fecha_fin, metodo_pago } = req.query;

    let queryVentas = `
      SELECT 
        v.id_venta,
        DATE_FORMAT(v.fecha_venta, '%Y-%m-%d') as fecha_venta,
        v.total,
        v.metodo_pago
      FROM ventas v
      WHERE v.id_usuario = ?
    `;
    const params = [userId];

    if (fecha_inicio) {
      queryVentas += ' AND v.fecha_venta >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      queryVentas += ' AND v.fecha_venta <= ?';
      params.push(fecha_fin);
    }
    if (metodo_pago && metodo_pago !== 'Todos') {
      queryVentas += ' AND v.metodo_pago = ?';
      params.push(metodo_pago);
    }

    queryVentas += ' ORDER BY v.fecha_venta DESC, v.id_venta DESC';

    const [ventasRows] = await pool.query(queryVentas, params);

    // Si no hay ventas, devolver vacío
    if (ventasRows.length === 0) {
      return res.json({
        success: true,
        resumen: {
          totalRecaudado: 0,
          totalOrdenes: 0,
          ticketPromedio: 0,
          desgloseMetodos: {}
        },
        data: []
      });
    }

    // Obtener detalles de todas las ventas consultadas
    const idsVentas = ventasRows.map(v => v.id_venta);
    const [detallesRows] = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_venta,
        d.id_producto,
        d.cantidad,
        d.precio_unitario,
        d.subtotal,
        p.nombre_producto
       FROM detalle_venta d
       JOIN productos p ON d.id_producto = p.id_producto
       WHERE d.id_venta IN (?)
       ORDER BY d.id_detalle ASC`,
      [idsVentas]
    );

    // Mapear detalles a cada venta
    const detallesPorVenta = {};
    detallesRows.forEach(det => {
      if (!detallesPorVenta[det.id_venta]) {
        detallesPorVenta[det.id_venta] = [];
      }
      detallesPorVenta[det.id_venta].push(det);
    });

    let totalRecaudado = 0;
    const desgloseMetodos = {
      'Efectivo': 0,
      'Tarjeta de Débito': 0,
      'Tarjeta de Crédito': 0,
      'Transferencia': 0
    };

    const ventasCompletas = ventasRows.map(v => {
      const monto = parseFloat(v.total);
      totalRecaudado += monto;
      if (desgloseMetodos[v.metodo_pago] !== undefined) {
        desgloseMetodos[v.metodo_pago] += monto;
      } else {
        desgloseMetodos[v.metodo_pago] = monto;
      }

      return {
        ...v,
        detalles: detallesPorVenta[v.id_venta] || []
      };
    });

    const totalOrdenes = ventasCompletas.length;
    const ticketPromedio = totalOrdenes > 0 ? (totalRecaudado / totalOrdenes) : 0;

    res.json({
      success: true,
      resumen: {
        totalRecaudado,
        totalOrdenes,
        ticketPromedio,
        desgloseMetodos
      },
      data: ventasCompletas
    });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar las ventas' });
  }
};

// Registrar una nueva venta con sus partidas
const create = async (req, res) => {
  let connection;
  try {
    const userId = req.userId;
    const { fecha_venta, metodo_pago, items } = req.body;

    if (!fecha_venta || !metodo_pago || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar la fecha, el método de pago y al menos un platillo en la orden'
      });
    }

    // Calcular total y validar partidas
    let totalCalculado = 0;
    for (const item of items) {
      const cant = parseInt(item.cantidad, 10);
      const precio = parseFloat(item.precio_unitario);
      if (isNaN(cant) || cant <= 0 || isNaN(precio) || precio < 0) {
        return res.status(400).json({ success: false, message: 'Cantidad o precio no válido en las partidas' });
      }
      totalCalculado += cant * precio;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insertar venta asociada al id_usuario
    const [resultVenta] = await connection.query(
      'INSERT INTO ventas (fecha_venta, total, metodo_pago, id_usuario) VALUES (?, ?, ?, ?)',
      [fecha_venta, totalCalculado, metodo_pago, userId]
    );

    const idVenta = resultVenta.insertId;

    // 2. Insertar detalles
    for (const item of items) {
      const cant = parseInt(item.cantidad, 10);
      const precio = parseFloat(item.precio_unitario);
      const subtotal = cant * precio;

      await connection.query(
        'INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [idVenta, item.id_producto, cant, precio, subtotal]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente',
      data: {
        id_venta: idVenta,
        fecha_venta,
        total: totalCalculado,
        metodo_pago
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al registrar venta:', error);
    res.status(500).json({ success: false, message: 'Error al registrar la venta en la base de datos' });
  } finally {
    if (connection) connection.release();
  }
};

// Editar una venta existente (Modificar fecha, método de pago y productos vendidos)
const update = async (req, res) => {
  let connection;
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { fecha_venta, metodo_pago, items } = req.body;

    if (!fecha_venta || !metodo_pago || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar la fecha, el método de pago y al menos un platillo en la orden'
      });
    }

    // Calcular nuevo total
    let totalCalculado = 0;
    for (const item of items) {
      const cant = parseInt(item.cantidad, 10);
      const precio = parseFloat(item.precio_unitario);
      if (isNaN(cant) || cant <= 0 || isNaN(precio) || precio < 0) {
        return res.status(400).json({ success: false, message: 'Cantidad o precio no válido en las partidas' });
      }
      totalCalculado += cant * precio;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Verificar existencia para este usuario
    const [existente] = await connection.query('SELECT id_venta FROM ventas WHERE id_venta = ? AND id_usuario = ? FOR UPDATE', [id, userId]);
    if (existente.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'La venta que intentas modificar no existe' });
    }

    // 2. Actualizar cabecera de la venta
    await connection.query(
      'UPDATE ventas SET fecha_venta = ?, total = ?, metodo_pago = ? WHERE id_venta = ? AND id_usuario = ?',
      [fecha_venta, totalCalculado, metodo_pago, id, userId]
    );

    // 3. Eliminar partidas anteriores y reinsertar las actualizadas
    await connection.query('DELETE FROM detalle_venta WHERE id_venta = ?', [id]);

    for (const item of items) {
      const cant = parseInt(item.cantidad, 10);
      const precio = parseFloat(item.precio_unitario);
      const subtotal = cant * precio;

      await connection.query(
        'INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [id, item.id_producto, cant, precio, subtotal]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Venta actualizada exitosamente',
      data: {
        id_venta: Number(id),
        fecha_venta,
        total: totalCalculado,
        metodo_pago
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la venta' });
  } finally {
    if (connection) connection.release();
  }
};

// Eliminar / anular una venta
const remove = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM ventas WHERE id_venta = ? AND id_usuario = ?', [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Venta no encontrada' });
    }

    res.json({ success: true, message: 'Venta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la venta' });
  }
};

// Obtener datos resumidos para el reporte ejecutivo
const getReporte = async (req, res) => {
  try {
    const userId = req.userId;
    const { fecha_inicio, fecha_fin, metodo_pago } = req.query;

    let whereClause = 'WHERE v.id_usuario = ?';
    const params = [userId];

    if (fecha_inicio) {
      whereClause += ' AND v.fecha_venta >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      whereClause += ' AND v.fecha_venta <= ?';
      params.push(fecha_fin);
    }
    if (metodo_pago && metodo_pago !== 'Todos') {
      whereClause += ' AND v.metodo_pago = ?';
      params.push(metodo_pago);
    }

    // Totales generales
    const [totales] = await pool.query(
      `SELECT COUNT(*) as total_ordenes, COALESCE(SUM(total), 0) as total_recaudado, COALESCE(AVG(total), 0) as promedio_orden FROM ventas v ${whereClause}`,
      params
    );

    // Desglose por método de pago
    const [metodos] = await pool.query(
      `SELECT metodo_pago, COUNT(*) as cantidad, SUM(total) as monto FROM ventas v ${whereClause} GROUP BY metodo_pago ORDER BY monto DESC`,
      params
    );

    // Platillos más vendidos
    let whereDetalle = 'WHERE v.id_usuario = ?';
    const paramsDetalle = [userId];
    if (fecha_inicio) {
      whereDetalle += ' AND v.fecha_venta >= ?';
      paramsDetalle.push(fecha_inicio);
    }
    if (fecha_fin) {
      whereDetalle += ' AND v.fecha_venta <= ?';
      paramsDetalle.push(fecha_fin);
    }
    if (metodo_pago && metodo_pago !== 'Todos') {
      whereDetalle += ' AND v.metodo_pago = ?';
      paramsDetalle.push(metodo_pago);
    }

    const [topProductos] = await pool.query(
      `SELECT p.nombre_producto, SUM(d.cantidad) as total_vendido, SUM(d.subtotal) as ingresos_generados
       FROM detalle_venta d
       JOIN productos p ON d.id_producto = p.id_producto
       JOIN ventas v ON d.id_venta = v.id_venta
       ${whereDetalle}
       GROUP BY p.id_producto, p.nombre_producto
       ORDER BY total_vendido DESC
       LIMIT 5`,
      paramsDetalle
    );

    // Listado de ventas en el período para la tabla del reporte
    const [ventasRows] = await pool.query(
      `SELECT 
        v.id_venta,
        DATE_FORMAT(v.fecha_venta, '%Y-%m-%d') as fecha_venta,
        v.total,
        v.metodo_pago
      FROM ventas v
      ${whereClause}
      ORDER BY v.fecha_venta DESC, v.id_venta DESC`,
      params
    );

    let ventasConDetalle = [];
    if (ventasRows.length > 0) {
      const idsVentas = ventasRows.map(v => v.id_venta);
      const [detallesRows] = await pool.query(
        `SELECT 
          d.id_detalle,
          d.id_venta,
          d.id_producto,
          d.cantidad,
          d.precio_unitario,
          d.subtotal,
          p.nombre_producto
         FROM detalle_venta d
         JOIN productos p ON d.id_producto = p.id_producto
         WHERE d.id_venta IN (?)
         ORDER BY d.id_detalle ASC`,
        [idsVentas]
      );

      const detallesPorVenta = {};
      detallesRows.forEach(det => {
        if (!detallesPorVenta[det.id_venta]) {
          detallesPorVenta[det.id_venta] = [];
        }
        detallesPorVenta[det.id_venta].push(det);
      });

      ventasConDetalle = ventasRows.map(v => ({
        ...v,
        detalles: detallesPorVenta[v.id_venta] || []
      }));
    }

    res.json({
      success: true,
      reporte: {
        rango: { fecha_inicio: fecha_inicio || null, fecha_fin: fecha_fin || null },
        metodo_pago: metodo_pago || 'Todos',
        resumen: totales[0],
        metodos,
        topProductos,
        ventas: ventasConDetalle
      }
    });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ success: false, message: 'Error interno al generar el reporte' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  getReporte
};
