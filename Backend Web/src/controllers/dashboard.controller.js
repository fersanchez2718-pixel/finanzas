const pool = require('../config/db');

// Obtener balance financiero consolidado (Ventas reales vs Compras reales)
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

    // 3. Consolidar por fecha
    const mapaFechas = {};

    ventas.forEach(v => {
      const f = v.fecha;
      if (!mapaFechas[f]) mapaFechas[f] = { fecha: f, ingresos: 0, gastos: 0 };
      mapaFechas[f].ingresos = parseFloat(v.ingresos || 0);
    });

    compras.forEach(c => {
      const f = c.fecha;
      if (!mapaFechas[f]) mapaFechas[f] = { fecha: f, ingresos: 0, gastos: 0 };
      mapaFechas[f].gastos = parseFloat(c.gastos || 0);
    });

    let transacciones = Object.values(mapaFechas).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    // Si aún no hay movimientos en la BD, dar datos base para visualización
    if (transacciones.length === 0) {
      const hoy = new Date().toISOString().split('T')[0];
      transacciones = [
        { fecha: hoy, ingresos: 0, gastos: 0 }
      ];
    }

    let totalIngresos = 0;
    let totalGastos = 0;

    transacciones.forEach(t => {
      totalIngresos += t.ingresos;
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

