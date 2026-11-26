const pool = require('../config/db');

// Obtener todos los gastos operativos con filtros y resumen analítico
const getAll = async (req, res) => {
  try {
    const userId = req.userId;
    const { fecha_inicio, fecha_fin, categoria } = req.query;

    let query = `
      SELECT 
        id_gasto,
        concepto,
        categoria,
        monto,
        DATE_FORMAT(fecha_gasto, '%Y-%m-%d') as fecha_gasto,
        metodo_pago,
        comprobante_referencia,
        notas,
        created_at
      FROM gastos_operativos
      WHERE id_usuario = ?
    `;
    const params = [userId];

    if (fecha_inicio) {
      query += ' AND fecha_gasto >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND fecha_gasto <= ?';
      params.push(fecha_fin);
    }
    if (categoria && categoria !== 'Todas') {
      query += ' AND categoria = ?';
      params.push(categoria);
    }

    query += ' ORDER BY fecha_gasto DESC, id_gasto DESC';

    const [rows] = await pool.query(query, params);

    // Calcular KPIs y desglose analítico
    let totalGastos = 0;
    const desgloseCategorias = {};

    rows.forEach(g => {
      const val = parseFloat(g.monto);
      totalGastos += val;
      if (!desgloseCategorias[g.categoria]) {
        desgloseCategorias[g.categoria] = { cantidad: 0, monto: 0 };
      }
      desgloseCategorias[g.categoria].cantidad += 1;
      desgloseCategorias[g.categoria].monto += val;
    });

    const cantidadRegistros = rows.length;
    const promedioGasto = cantidadRegistros > 0 ? (totalGastos / cantidadRegistros) : 0;

    res.json({
      success: true,
      resumen: {
        totalGastos,
        cantidadRegistros,
        promedioGasto,
        desgloseCategorias
      },
      data: rows
    });
  } catch (error) {
    console.error('Error al consultar gastos operativos:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar los gastos operativos' });
  }
};

// Registrar un nuevo gasto operativo
const create = async (req, res) => {
  try {
    const userId = req.userId;
    const { concepto, categoria, monto, fecha_gasto, metodo_pago, comprobante_referencia, notas } = req.body;

    if (!concepto || !categoria || monto === undefined || !fecha_gasto || !metodo_pago) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar concepto, categoría, monto válido, fecha y forma de pago'
      });
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del gasto debe ser un número positivo mayor a cero'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO gastos_operativos 
        (concepto, categoria, monto, fecha_gasto, metodo_pago, comprobante_referencia, notas, id_usuario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        concepto.trim(),
        categoria.trim(),
        montoNum,
        fecha_gasto,
        metodo_pago.trim(),
        comprobante_referencia ? comprobante_referencia.trim() : null,
        notas ? notas.trim() : null,
        userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Gasto operativo registrado correctamente',
      id_gasto: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar gasto operativo:', error);
    res.status(500).json({ success: false, message: 'Error interno al guardar el gasto operativo' });
  }
};

// Actualizar un gasto operativo existente
const update = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { concepto, categoria, monto, fecha_gasto, metodo_pago, comprobante_referencia, notas } = req.body;

    if (!concepto || !categoria || monto === undefined || !fecha_gasto || !metodo_pago) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben estar presentes'
      });
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del gasto debe ser un número positivo mayor a cero'
      });
    }

    const [existente] = await pool.query('SELECT id_gasto FROM gastos_operativos WHERE id_gasto = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Registro de gasto no encontrado' });
    }

    await pool.query(
      `UPDATE gastos_operativos 
       SET concepto = ?, categoria = ?, monto = ?, fecha_gasto = ?, metodo_pago = ?, comprobante_referencia = ?, notas = ?
       WHERE id_gasto = ? AND id_usuario = ?`,
      [
        concepto.trim(),
        categoria.trim(),
        montoNum,
        fecha_gasto,
        metodo_pago.trim(),
        comprobante_referencia ? comprobante_referencia.trim() : null,
        notas ? notas.trim() : null,
        id,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'Gasto operativo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar gasto operativo:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar el gasto operativo' });
  }
};

// Eliminar / anular un gasto operativo
const remove = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const [existente] = await pool.query('SELECT id_gasto FROM gastos_operativos WHERE id_gasto = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'El gasto a eliminar no existe' });
    }

    await pool.query('DELETE FROM gastos_operativos WHERE id_gasto = ? AND id_usuario = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Gasto operativo anulado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar gasto operativo:', error);
    res.status(500).json({ success: false, message: 'Error interno al anular el gasto operativo' });
  }
};

module.exports = {
  getAll,
  create,
  update,
  remove
};
