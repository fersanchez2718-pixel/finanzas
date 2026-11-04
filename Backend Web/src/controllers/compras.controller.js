const pool = require('../config/db');

// Obtener historial de compras con métricas
const getAll = async (req, res) => {
  try {
    const { busqueda, mes, anio } = req.query;

    let query = `
      SELECT 
        c.id_compra,
        c.id_materia_prima,
        DATE_FORMAT(c.fecha_compra, '%Y-%m-%d') as fecha_compra,
        c.cantidad,
        c.costo_total,
        ROUND(c.costo_total / NULLIF(c.cantidad, 0), 2) AS costo_unitario_compra,
        m.nombre AS nombre_materia_prima,
        m.unidad_medida,
        m.cantidad_disponible AS stock_actual_insumo
      FROM COMPRAS_MATERIA_PRIMA c
      JOIN MATERIA_PRIMA m ON c.id_materia_prima = m.id_materia_prima
      WHERE 1=1
    `;
    const params = [];

    if (busqueda) {
      query += ' AND m.nombre LIKE ?';
      params.push(`%${busqueda}%`);
    }

    if (mes) {
      query += ' AND MONTH(c.fecha_compra) = ?';
      params.push(mes);
    }

    if (anio) {
      query += ' AND YEAR(c.fecha_compra) = ?';
      params.push(anio);
    }

    query += ' ORDER BY c.fecha_compra DESC, c.id_compra DESC';

    const [rows] = await pool.query(query, params);

    // Calcular KPIs
    const totalCompras = rows.length;
    let gastoTotal = 0;

    rows.forEach(r => {
      gastoTotal += parseFloat(r.costo_total || 0);
    });

    const compraPromedio = totalCompras > 0 ? (gastoTotal / totalCompras) : 0;
    const ultimaCompra = rows.length > 0 ? rows[0].fecha_compra : null;

    res.json({
      success: true,
      resumen: {
        totalCompras,
        gastoTotal,
        compraPromedio,
        ultimaCompra
      },
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar el historial de compras' });
  }
};

// Registrar una nueva compra y actualizar stock en MATERIA_PRIMA
const create = async (req, res) => {
  let connection;
  try {
    const { id_materia_prima, fecha_compra, cantidad, costo_total } = req.body;

    if (!id_materia_prima || !fecha_compra || cantidad === undefined || costo_total === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios (insumo, fecha, cantidad, costo total)'
      });
    }

    const cantNum = parseFloat(cantidad);
    const costoNum = parseFloat(costo_total);

    if (isNaN(cantNum) || cantNum <= 0 || isNaN(costoNum) || costoNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a cero y el costo total no puede ser negativo'
      });
    }

    // Usar transacción para consistencia
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Verificar insumo
    const [insumo] = await connection.query(
      'SELECT id_materia_prima, nombre, cantidad_disponible, costo_unitario FROM MATERIA_PRIMA WHERE id_materia_prima = ? FOR UPDATE',
      [id_materia_prima]
    );

    if (insumo.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'El insumo seleccionado no existe' });
    }

    // 2. Insertar compra
    const [resultCompra] = await connection.query(
      'INSERT INTO COMPRAS_MATERIA_PRIMA (id_materia_prima, fecha_compra, cantidad, costo_total) VALUES (?, ?, ?, ?)',
      [id_materia_prima, fecha_compra, cantNum, costoNum]
    );

    // 3. Incrementar stock y recalcular estado
    const stockAnterior = parseFloat(insumo[0].cantidad_disponible);
    const nuevoStock = stockAnterior + cantNum;
    const nuevoEstado = nuevoStock > 5 ? 'Disponible' : nuevoStock > 0 ? 'Stock Bajo' : 'Agotado';

    await connection.query(
      'UPDATE MATERIA_PRIMA SET cantidad_disponible = ?, estado = ? WHERE id_materia_prima = ?',
      [nuevoStock, nuevoEstado, id_materia_prima]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Compra registrada exitosamente. Se sumaron ${cantNum} al inventario de ${insumo[0].nombre}`,
      data: {
        id_compra: resultCompra.insertId,
        id_materia_prima,
        nombre_materia_prima: insumo[0].nombre,
        fecha_compra,
        cantidad: cantNum,
        costo_total: costoNum,
        nuevo_stock_insumo: nuevoStock,
        nuevo_estado_insumo: nuevoEstado
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al registrar compra:', error);
    res.status(500).json({ success: false, message: 'Error al registrar la compra en la base de datos' });
  } finally {
    if (connection) connection.release();
  }
};

// Eliminar compra y revertir stock sumado
const remove = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener datos de la compra a anular
    const [compra] = await connection.query(
      'SELECT id_compra, id_materia_prima, cantidad FROM COMPRAS_MATERIA_PRIMA WHERE id_compra = ? FOR UPDATE',
      [id]
    );

    if (compra.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Registro de compra no encontrado' });
    }

    const { id_materia_prima, cantidad } = compra[0];
    const cantNum = parseFloat(cantidad);

    // 2. Eliminar compra
    await connection.query('DELETE FROM COMPRAS_MATERIA_PRIMA WHERE id_compra = ?', [id]);

    // 3. Revertir stock en MATERIA_PRIMA (sin permitir negativos)
    const [insumo] = await connection.query(
      'SELECT cantidad_disponible, nombre FROM MATERIA_PRIMA WHERE id_materia_prima = ? FOR UPDATE',
      [id_materia_prima]
    );

    if (insumo.length > 0) {
      const stockActual = parseFloat(insumo[0].cantidad_disponible);
      const stockRevertido = Math.max(0, stockActual - cantNum);
      const nuevoEstado = stockRevertido > 5 ? 'Disponible' : stockRevertido > 0 ? 'Stock Bajo' : 'Agotado';

      await connection.query(
        'UPDATE MATERIA_PRIMA SET cantidad_disponible = ?, estado = ? WHERE id_materia_prima = ?',
        [stockRevertido, nuevoEstado, id_materia_prima]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Compra cancelada exitosamente y stock revertido en inventario'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar compra:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la compra' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getAll,
  create,
  remove
};

