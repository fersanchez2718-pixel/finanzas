const pool = require('../config/db');

// Obtener balance financiero consolidado (Ventas reales vs Compras + Gastos Operativos)
const getBalance = async (req, res) => {
  try {
    // 1. Ingresos reales desde VENTAS
    const [ventas] = await pool.query(
      `SELECT 
        DATE_FORMAT(fecha_venta, '%Y-%m-%d') as fecha,
        SUM(total) as ingresos
       FROM VENTAS
       GROUP BY fecha_venta
       ORDER BY fecha_venta ASC`
    );

    // 2. Gastos reales desde COMPRAS_MATERIA_PRIMA
    const [compras] = await pool.query(
      `SELECT 
        DATE_FORMAT(fecha_compra, '%Y-%m-%d') as fecha,
        SUM(costo_total) as gastos
       FROM COMPRAS_MATERIA_PRIMA
       GROUP BY fecha_compra
       ORDER BY fecha_compra ASC`
    );

    // 3. Gastos operativos (servicios, renta, limpieza, empaques, etc.)
    let gastosOperativos = [];
    try {
      const [goRows] = await pool.query(
        `SELECT 
          DATE_FORMAT(fecha_gasto, '%Y-%m-%d') as fecha,
          SUM(monto) as gastos_operativos
         FROM GASTOS_OPERATIVOS
         GROUP BY fecha_gasto
         ORDER BY fecha_gasto ASC`
      );
      gastosOperativos = goRows;
    } catch (e) {
      gastosOperativos = [];
    }

    // 4. Pagos de nómina y sueldos
    let pagosNomina = [];
    try {
      const [nomRows] = await pool.query(
        `SELECT 
          DATE_FORMAT(fecha_pago, '%Y-%m-%d') as fecha,
          SUM(total_pagado) as gastos_nomina
         FROM PAGOS_EMPLEADOS
         GROUP BY fecha_pago
         ORDER BY fecha_pago ASC`
      );
      pagosNomina = nomRows;
    } catch (e) {
      pagosNomina = [];
    }

    // 5. Consolidar por fecha
    const mapaFechas = {};

    ventas.forEach(v => {
      const f = v.fecha;
      if (!mapaFechas[f]) mapaFechas[f] = { fecha: f, ingresos: 0, gastos: 0, gastos_materia: 0, gastos_operativos: 0, gastos_nomina: 0 };
      mapaFechas[f].ingresos += parseFloat(v.ingresos || 0);
    });

    compras.forEach(c => {
      const f = c.fecha;
      if (!mapaFechas[f]) mapaFechas[f] = { fecha: f, ingresos: 0, gastos: 0, gastos_materia: 0, gastos_operativos: 0, gastos_nomina: 0 };
      const m = parseFloat(c.gastos || 0);
      mapaFechas[f].gastos_materia += m;
      mapaFechas[f].gastos += m;
    });

    gastosOperativos.forEach(g => {
      const f = g.fecha;
      if (!mapaFechas[f]) mapaFechas[f] = { fecha: f, ingresos: 0, gastos: 0, gastos_materia: 0, gastos_operativos: 0, gastos_nomina: 0 };
      const m = parseFloat(g.gastos_operativos || 0);
      mapaFechas[f].gastos_operativos += m;
      mapaFechas[f].gastos += m;
    });

    pagosNomina.forEach(p => {
      const f = p.fecha;
      if (!mapaFechas[f]) mapaFechas[f] = { fecha: f, ingresos: 0, gastos: 0, gastos_materia: 0, gastos_operativos: 0, gastos_nomina: 0 };
      const m = parseFloat(p.gastos_nomina || 0);
      mapaFechas[f].gastos_nomina += m;
      mapaFechas[f].gastos += m;
    });

    let transacciones = Object.values(mapaFechas).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Si aún no hay movimientos en la BD, dar datos base para visualización
    if (transacciones.length === 0) {
      const hoy = new Date().toISOString().split('T')[0];
      transacciones = [
        { fecha: hoy, ingresos: 0, gastos: 0, gastos_materia: 0, gastos_operativos: 0, gastos_nomina: 0 }
      ];
    }

    let totalIngresos = 0;
    let totalGastosMateria = 0;
    let totalGastosOperativos = 0;
    let totalGastosNomina = 0;
    let totalGastos = 0;

    transacciones.forEach(t => {
      totalIngresos += t.ingresos;
      totalGastosMateria += t.gastos_materia;
      totalGastosOperativos += t.gastos_operativos;
      totalGastosNomina += t.gastos_nomina;
      totalGastos += t.gastos;
    });

    const utilidadNeta = totalIngresos - totalGastos;
    const margen = totalIngresos > 0 ? ((utilidadNeta / totalIngresos) * 100) : 0;

    res.json({
      success: true,
      transacciones,
      kpis: {
        totalIngresos,
        totalGastos,
        totalGastosMateria,
        totalGastosOperativos,
        totalGastosNomina,
        utilidadNeta,
        margen: margen.toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error al obtener balance del dashboard:', error);
    res.status(500).json({ success: false, message: 'Error interno al consultar balance financiero' });
  }
};

module.exports = { getBalance };

