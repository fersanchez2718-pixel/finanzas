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

const productosIniciales = [
  { nombre_producto: 'Hamburguesa Clásica con Queso', descripcion: 'Carne 150g, queso cheddar, lechuga y tomate en pan brioche', precio: 120.00, estado: 'Disponible' },
  { nombre_producto: 'Hamburguesa Doble Tocino', descripcion: 'Doble carne 300g, tocino crocante, queso cheddar y aderezo especial', precio: 165.00, estado: 'Disponible' },
  { nombre_producto: 'Orden de Boneless BBQ (300g)', descripcion: 'Pechuga de pollo empanizada en salsa BBQ con papas', precio: 140.00, estado: 'Disponible' },
  { nombre_producto: 'Papas a la Francesa Corte Recto', descripcion: 'Papas doradas crujientes con queso cheddar y tocino', precio: 65.00, estado: 'Disponible' },
  { nombre_producto: 'Refresco de Lata (355ml)', descripcion: 'Variedad de sabores (Coca Cola, Sprite, Fanta)', precio: 30.00, estado: 'Disponible' },
  { nombre_producto: 'Agua Fresca Artesanal (1 Litro)', descripcion: 'Agua de fruta natural del día', precio: 35.00, estado: 'Disponible' }
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

    // Sembrar productos / menú si está vacío
    const [prodRows] = await pool.query('SELECT COUNT(*) as total FROM PRODUCTOS');
    if (prodRows[0].total === 0) {
      console.log('Sembrando menú de platillos en PRODUCTOS...');
      for (const prod of productosIniciales) {
        await pool.query(
          'INSERT INTO PRODUCTOS (nombre_producto, descripcion, precio, estado) VALUES (?, ?, ?, ?)',
          [prod.nombre_producto, prod.descripcion, prod.precio, prod.estado]
        );
      }
      console.log('✓ Menú inicial de platillos insertado en PRODUCTOS.');
    }
  } catch (error) {
    console.error('Error al verificar o sembrar datos:', error);
  }
};

module.exports = { seedMateriaPrima };
