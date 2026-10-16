const pool = require('../config/db');

const insumosIniciales = [
  { nombre: 'Carne de Res Molida 80/20', unidad_medida: 'Kg', cantidad_disponible: 25.50, costo_unitario: 145.00, estado: 'Disponible' },
  { nombre: 'Pechuga de Pollo Fresca', unidad_medida: 'Kg', cantidad_disponible: 18.00, costo_unitario: 95.00, estado: 'Disponible' },
  { nombre: 'Queso Cheddar Americano', unidad_medida: 'Kg', cantidad_disponible: 4.20, costo_unitario: 120.00, estado: 'Stock Bajo' },
  { nombre: 'Pan para Hamburguesa Brioche', unidad_medida: 'Pza', cantidad_disponible: 60.00, costo_unitario: 8.50, estado: 'Disponible' },
  { nombre: 'Tomate Saladette', unidad_medida: 'Kg', cantidad_disponible: 2.00, costo_unitario: 28.00, estado: 'Stock Bajo' },
  { nombre: 'Cebolla Blanca', unidad_medida: 'Kg', cantidad_disponible: 12.00, costo_unitario: 22.00, estado: 'Disponible' },
  { nombre: 'Aceite Vegetal Comestible', unidad_medida: 'Litro', cantidad_disponible: 15.00, costo_unitario: 38.50, estado: 'Disponible' },
  { nombre: 'Lechuga Romana Fresca', unidad_medida: 'Pza', cantidad_disponible: 0.00, costo_unitario: 18.00, estado: 'Agotado' },
  { nombre: 'Tocino Ahumado de Cerdo', unidad_medida: 'Kg', cantidad_disponible: 8.50, costo_unitario: 160.00, estado: 'Disponible' },
  { nombre: 'Papas a la Francesa Corte Recto', unidad_medida: 'Kg', cantidad_disponible: 30.00, costo_unitario: 45.00, estado: 'Disponible' },
];

const seedMateriaPrima = async () => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM MATERIA_PRIMA');
    if (rows[0].total === 0) {
      console.log('Sembrando catálogo inicial de materia prima (Negocio de Comida)...');
      for (const item of insumosIniciales) {
        await pool.query(
          'INSERT INTO MATERIA_PRIMA (nombre, unidad_medida, cantidad_disponible, costo_unitario, estado) VALUES (?, ?, ?, ?, ?)',
          [item.nombre, item.unidad_medida, item.cantidad_disponible, item.costo_unitario, item.estado]
        );
      }
      console.log('✓ 10 Insumos culinarios insertados exitosamente en MATERIA_PRIMA.');
    }
  } catch (error) {
    console.error('Error al verificar o sembrar materia prima:', error);
  }
};

module.exports = { seedMateriaPrima };
