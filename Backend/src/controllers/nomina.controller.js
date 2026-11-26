const pool = require('../config/db');

// ==========================================
// CONTROLADOR DE empleados
// ==========================================

// Obtener todos los colaboradores del usuario
const getEmpleados = async (req, res) => {
  try {
    const userId = req.userId;
    const { estado } = req.query;
    let query = `
      SELECT 
        id_empleado,
        nombre,
        COALESCE(puesto, 'General') as puesto,
        COALESCE(telefono, '') as telefono,
        sueldo_diario,
        DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') as fecha_ingreso,
        COALESCE(estado, 'Activo') as estado,
        experiencia_laboral
      FROM empleados
      WHERE id_usuario = ?
    `;
    const params = [userId];

    if (estado && estado !== 'Todos') {
      query += ' AND COALESCE(estado, "Activo") = ?';
      params.push(estado);
    }

    query += ' ORDER BY nombre ASC';

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al consultar empleados:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar colaboradores' });
  }
};

// Crear nuevo empleado
const createEmpleado = async (req, res) => {
  try {
    const userId = req.userId;
    const { nombre, puesto, telefono, sueldo_diario, fecha_ingreso, estado, experiencia_laboral } = req.body;

    if (!nombre || sueldo_diario === undefined || !fecha_ingreso) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar el nombre completo, el sueldo diario y la fecha de ingreso'
      });
    }

    const sueldoNum = parseFloat(sueldo_diario);
    if (isNaN(sueldoNum) || sueldoNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El sueldo diario debe ser un valor numérico mayor a 0'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO empleados 
        (nombre, puesto, telefono, sueldo_diario, fecha_ingreso, estado, experiencia_laboral, id_usuario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre.trim(),
        puesto ? puesto.trim() : 'General',
        telefono ? telefono.trim() : null,
        sueldoNum,
        fecha_ingreso,
        estado || 'Activo',
        experiencia_laboral ? experiencia_laboral.trim() : null,
        userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Colaborador registrado exitosamente en el equipo',
      id_empleado: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar empleado' });
  }
};

// Actualizar datos del empleado
const updateEmpleado = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { nombre, puesto, telefono, sueldo_diario, fecha_ingreso, estado, experiencia_laboral } = req.body;

    if (!nombre || sueldo_diario === undefined || !fecha_ingreso) {
      return res.status(400).json({
        success: false,
        message: 'El nombre, sueldo diario y fecha de ingreso son obligatorios'
      });
    }

    const sueldoNum = parseFloat(sueldo_diario);
    if (isNaN(sueldoNum) || sueldoNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El sueldo diario debe ser mayor a 0'
      });
    }

    const [existente] = await pool.query('SELECT id_empleado FROM empleados WHERE id_empleado = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
    }

    await pool.query(
      `UPDATE empleados 
       SET nombre = ?, puesto = ?, telefono = ?, sueldo_diario = ?, fecha_ingreso = ?, estado = ?, experiencia_laboral = ?
       WHERE id_empleado = ? AND id_usuario = ?`,
      [
        nombre.trim(),
        puesto ? puesto.trim() : 'General',
        telefono ? telefono.trim() : null,
        sueldoNum,
        fecha_ingreso,
        estado || 'Activo',
        experiencia_laboral ? experiencia_laboral.trim() : null,
        id,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'Datos del colaborador actualizados correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ success: false, message: 'Error interno al actualizar empleado' });
  }
};

// Eliminar / dar de baja empleado
const removeEmpleado = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const [existente] = await pool.query('SELECT id_empleado FROM empleados WHERE id_empleado = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Colaborador no encontrado' });
    }

    await pool.query('DELETE FROM empleados WHERE id_empleado = ? AND id_usuario = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Colaborador eliminado del catálogo'
    });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ success: false, message: 'No se puede eliminar el empleado si tiene registros de pago asociados' });
  }
};

// ==========================================
// CONTROLADOR DE PAGOS DE NÓMINA
// ==========================================

// Consultar pagos de nómina históricos con datos del empleado
const getPagos = async (req, res) => {
  try {
    const userId = req.userId;
    const { fecha_inicio, fecha_fin, id_empleado } = req.query;

    let query = `
      SELECT 
        p.id_pago,
        p.id_empleado,
        e.nombre as nombre_empleado,
        COALESCE(e.puesto, 'General') as puesto_empleado,
        DATE_FORMAT(p.fecha_pago, '%Y-%m-%d') as fecha_pago,
        p.periodo,
        p.dias_trabajados,
        p.sueldo_diario,
        COALESCE(p.bonos, 0) as bonos,
        COALESCE(p.deducciones, 0) as deducciones,
        p.total_pagado,
        p.metodo_pago,
        p.notas
      FROM pagos_empleados p
      JOIN empleados e ON p.id_empleado = e.id_empleado
      WHERE p.id_usuario = ?
    `;
    const params = [userId];

    if (fecha_inicio) {
      query += ' AND p.fecha_pago >= ?';
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND p.fecha_pago <= ?';
      params.push(fecha_fin);
    }
    if (id_empleado && id_empleado !== 'Todos') {
      query += ' AND p.id_empleado = ?';
      params.push(id_empleado);
    }

    query += ' ORDER BY p.fecha_pago DESC, p.id_pago DESC';

    const [rows] = await pool.query(query, params);

    let totalDispersado = 0;
    rows.forEach(p => {
      totalDispersado += parseFloat(p.total_pagado);
    });

    res.json({
      success: true,
      resumen: {
        totalDispersado,
        recibosEmitidos: rows.length
      },
      data: rows
    });
  } catch (error) {
    console.error('Error al consultar nómina:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar los pagos de nómina' });
  }
};

// Registrar dispersión de pago a un empleado
const createPago = async (req, res) => {
  try {
    const userId = req.userId;
    const { id_empleado, fecha_pago, periodo, dias_trabajados, sueldo_diario, bonos, deducciones, metodo_pago, notas } = req.body;

    if (!id_empleado || !fecha_pago || !periodo || dias_trabajados === undefined || sueldo_diario === undefined || !metodo_pago) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar el empleado, fecha, período, días laborados y forma de pago'
      });
    }

    const dias = parseInt(dias_trabajados, 10);
    const sueldo = parseFloat(sueldo_diario);
    const bonosNum = parseFloat(bonos || 0);
    const deduccionesNum = parseFloat(deducciones || 0);

    if (isNaN(dias) || dias <= 0 || isNaN(sueldo) || sueldo <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Días laborados y sueldo diario deben ser números positivos válidos'
      });
    }

    // Validar que el empleado pertenezca al usuario
    const [empCheck] = await pool.query('SELECT id_empleado FROM empleados WHERE id_empleado = ? AND id_usuario = ?', [id_empleado, userId]);
    if (empCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }

    // Calcular total automáticamente: (dias * sueldo) + bonos - deducciones
    const subtotal = dias * sueldo;
    const totalCalculado = Math.max(0, subtotal + bonosNum - deduccionesNum);

    const [result] = await pool.query(
      `INSERT INTO pagos_empleados 
        (id_empleado, fecha_pago, periodo, dias_trabajados, sueldo_diario, bonos, deducciones, total_pagado, metodo_pago, notas, id_usuario) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_empleado,
        fecha_pago,
        periodo.trim(),
        dias,
        sueldo,
        bonosNum,
        deduccionesNum,
        totalCalculado,
        metodo_pago.trim(),
        notas ? notas.trim() : null,
        userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Pago de nómina registrado exitosamente',
      id_pago: result.insertId,
      total_pagado: totalCalculado
    });
  } catch (error) {
    console.error('Error al registrar pago de nómina:', error);
    res.status(500).json({ success: false, message: 'Error interno al registrar el pago de nómina' });
  }
};

// Anular pago de nómina
const removePago = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const [existente] = await pool.query('SELECT id_pago FROM pagos_empleados WHERE id_pago = ? AND id_usuario = ?', [id, userId]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Recibo de nómina no encontrado' });
    }

    await pool.query('DELETE FROM pagos_empleados WHERE id_pago = ? AND id_usuario = ?', [id, userId]);

    res.json({
      success: true,
      message: 'Recibo de nómina anulado correctamente'
    });
  } catch (error) {
    console.error('Error al anular pago de nómina:', error);
    res.status(500).json({ success: false, message: 'Error interno al anular el recibo de nómina' });
  }
};

// Resumen general para la cabecera de Nómina
const getResumenNomina = async (req, res) => {
  try {
    const userId = req.userId;
    const [empRows] = await pool.query(
      'SELECT COUNT(*) as total_empleados, SUM(CASE WHEN estado = "Activo" THEN 1 ELSE 0 END) as empleados_activos, SUM(CASE WHEN estado = "Activo" THEN sueldo_diario ELSE 0 END) as costo_diario_plantilla FROM empleados WHERE id_usuario = ?',
      [userId]
    );

    const [pagoRows] = await pool.query(
      'SELECT COALESCE(SUM(total_pagado), 0) as total_historico, COUNT(*) as total_recibos FROM pagos_empleados WHERE id_usuario = ?',
      [userId]
    );

    const empData = empRows[0] || {};
    const pagoData = pagoRows[0] || {};

    const costoDiario = parseFloat(empData.costo_diario_plantilla || 0);

    res.json({
      success: true,
      resumen: {
        totalEmpleados: parseInt(empData.total_empleados || 0, 10),
        empleadosActivos: parseInt(empData.empleados_activos || 0, 10),
        costoDiarioPlantilla: costoDiario,
        costoSemanalProyectado: costoDiario * 6,
        costoMensualProyectado: costoDiario * 24,
        totalDispersadoHistorico: parseFloat(pagoData.total_historico || 0),
        totalRecibosEmitidos: parseInt(pagoData.total_recibos || 0, 10)
      }
    });
  } catch (error) {
    console.error('Error al obtener resumen de nómina:', error);
    res.status(500).json({ success: false, message: 'Error interno al obtener resumen de nómina' });
  }
};

module.exports = {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  removeEmpleado,
  getPagos,
  createPago,
  removePago,
  getResumenNomina
};
