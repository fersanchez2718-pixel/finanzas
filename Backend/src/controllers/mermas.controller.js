const pool = require('../config/db');

// Obtener todas las mermas registradas con métricas para el usuario
const getAll = async (req, res) => {
  try {
    const userId = req.userId;
    const { busqueda, mes, anio } = req.query;

    let query = `
      SELECT 
        d.id_desperdicio,
        d.id_materia_prima,
        DATE_FORMAT(d.fecha, '%Y-%m-%d') as fecha,
        d.cantidad_desperdiciada,
        d.porcentaje_desperdicio,
        d.motivo,
        m.nombre as nombre_materia_prima,
        m.unidad_medida,
        m.costo_unitario,
        ROUND(d.cantidad_desperdiciada * m.costo_unitario, 2) as costo_perdida,
        m.cantidad_disponible as stock_actual
      FROM desperdicios d
      JOIN materia_prima m ON d.id_materia_prima = m.id_materia_prima
      WHERE d.id_usuario = ?
    `;
    const params = [userId];

    if (busqueda) {
      query += ' AND m.nombre LIKE ?';
      params.push(`%${busqueda}%`);
    }

    if (mes) {
      query += ' AND MONTH(d.fecha) = ?';
      params.push(mes);
    }

    if (anio) {
      query += ' AND YEAR(d.fecha) = ?';
      params.push(anio);
    }

    query += ' ORDER BY d.fecha DESC, d.id_desperdicio DESC';

    const [rows] = await pool.query(query, params);

    let perdidaTotal = 0;
    const conteoInsumos = {};

    rows.forEach(r => {
      perdidaTotal += parseFloat(r.costo_perdida || 0);
      conteoInsumos[r.nombre_materia_prima] = (conteoInsumos[r.nombre_materia_prima] || 0) + parseFloat(r.cantidad_desperdiciada);
    });

    // Insumo más afectado
    let insumoMasMermado = 'Ninguno';
    let maxMerma = 0;
    for (const [nombre, cant] of Object.entries(conteoInsumos)) {
      if (cant > maxMerma) {
        maxMerma = cant;
        insumoMasMermado = nombre;
      }
    }

    res.json({
      success: true,
      resumen: {
        totalIncidentes: rows.length,
        perdidaTotal,
        insumoMasMermado
      },
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener mermas:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar control de mermas' });
  }
};

// Registrar una nueva merma y descontar del inventario
const create = async (req, res) => {
  let connection;
  try {
    const userId = req.userId;
    const { id_materia_prima, fecha, cantidad_desperdiciada, motivo } = req.body;

    if (!id_materia_prima || !fecha || cantidad_desperdiciada === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios (insumo, fecha, cantidad desperdiciada)'
      });
    }

    const cantNum = parseFloat(cantidad_desperdiciada);
    if (isNaN(cantNum) || cantNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad desperdiciada debe ser un número mayor a cero'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener insumo actual
    const [insumo] = await connection.query(
      'SELECT id_materia_prima, nombre, unidad_medida, cantidad_disponible, costo_unitario FROM materia_prima WHERE id_materia_prima = ? AND id_usuario = ? FOR UPDATE',
      [id_materia_prima, userId]
    );

    if (insumo.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'El insumo seleccionado no existe' });
    }

    const stockActual = parseFloat(insumo[0].cantidad_disponible);
    if (cantNum > stockActual) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `La cantidad mermada (${cantNum} ${insumo[0].unidad_medida}) no puede superar el stock actual disponible (${stockActual} ${insumo[0].unidad_medida})`
      });
    }

    // Calcular porcentaje de merma respecto al stock disponible
    const porcentaje = stockActual > 0 ? Math.min(100, (cantNum / stockActual) * 100) : 100;
    const motivoFinal = motivo || 'Merma de cocina / preparación';

    // 2. Insertar merma vinculada al usuario
    const [resultMerma] = await connection.query(
      'INSERT INTO desperdicios (id_materia_prima, fecha, cantidad_desperdiciada, porcentaje_desperdicio, motivo, id_usuario) VALUES (?, ?, ?, ?, ?, ?)',
      [id_materia_prima, fecha, cantNum, porcentaje.toFixed(2), motivoFinal, userId]
    );

    // 3. Descontar del inventario y recalcular estado
    const nuevoStock = Math.max(0, stockActual - cantNum);
    const nuevoEstado = nuevoStock > 5 ? 'Disponible' : nuevoStock > 0 ? 'Stock Bajo' : 'Agotado';

    await connection.query(
      'UPDATE materia_prima SET cantidad_disponible = ?, estado = ? WHERE id_materia_prima = ? AND id_usuario = ?',
      [nuevoStock, nuevoEstado, id_materia_prima, userId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Merma registrada exitosamente. Se descontaron ${cantNum} ${insumo[0].unidad_medida} del inventario.`,
      data: {
        id_desperdicio: resultMerma.insertId,
        id_materia_prima,
        nombre_materia_prima: insumo[0].nombre,
        fecha,
        cantidad_desperdiciada: cantNum,
        porcentaje_desperdicio: porcentaje.toFixed(2),
        motivo: motivoFinal,
        stock_restante: nuevoStock
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al registrar merma:', error);
    res.status(500).json({ success: false, message: 'Error al registrar la merma en la base de datos' });
  } finally {
    if (connection) connection.release();
  }
};

// Anular una merma y reintegrar el stock al inventario
const remove = async (req, res) => {
  let connection;
  try {
    const userId = req.userId;
    const { id } = req.params;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Obtener la merma a anular
    const [merma] = await connection.query(
      'SELECT id_desperdicio, id_materia_prima, cantidad_desperdiciada FROM desperdicios WHERE id_desperdicio = ? AND id_usuario = ? FOR UPDATE',
      [id, userId]
    );

    if (merma.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Registro de merma no encontrado' });
    }

    const { id_materia_prima, cantidad_desperdiciada } = merma[0];
    const cantNum = parseFloat(cantidad_desperdiciada);

    // 2. Eliminar merma
    await connection.query('DELETE FROM desperdicios WHERE id_desperdicio = ? AND id_usuario = ?', [id, userId]);

    // 3. Reintegrar stock a materia_prima
    const [insumo] = await connection.query(
      'SELECT cantidad_disponible FROM materia_prima WHERE id_materia_prima = ? AND id_usuario = ? FOR UPDATE',
      [id_materia_prima, userId]
    );

    if (insumo.length > 0) {
      const stockActual = parseFloat(insumo[0].cantidad_disponible);
      const nuevoStock = stockActual + cantNum;
      const nuevoEstado = nuevoStock > 5 ? 'Disponible' : nuevoStock > 0 ? 'Stock Bajo' : 'Agotado';

      await connection.query(
        'UPDATE materia_prima SET cantidad_disponible = ?, estado = ? WHERE id_materia_prima = ? AND id_usuario = ?',
        [nuevoStock, nuevoEstado, id_materia_prima, userId]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Merma cancelada exitosamente y stock reintegrado al inventario'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al anular merma:', error);
    res.status(500).json({ success: false, message: 'Error al anular la merma' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getAll,
  create,
  remove
};
