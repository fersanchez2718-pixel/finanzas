const pool = require('../config/db');
const crypto = require('crypto');

const hashPwd = (pwd) => crypto.createHash('sha256').update(pwd + '_fooderp_salt_2026').digest('hex');

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

const gastosOperativosIniciales = [
  { concepto: 'Renta Mensual del Local Comercial', categoria: 'Renta', monto: 12000.00, fecha_gasto: '2026-11-01', metodo_pago: 'Transferencia', comprobante_referencia: 'FAC-RENT-001', notas: 'Pago puntual mes en curso' },
  { concepto: 'Servicio de Luz CFE (Bimestre Comercial)', categoria: 'Servicios', monto: 3450.00, fecha_gasto: '2026-11-02', metodo_pago: 'Transferencia', comprobante_referencia: 'CFE-883921', notas: 'Tarifa comercial negocio' },
  { concepto: 'Suministro de Gas LP Comercial (Carga 45kg)', categoria: 'Servicios', monto: 1850.00, fecha_gasto: '2026-11-03', metodo_pago: 'Efectivo', comprobante_referencia: 'GAS-00492', notas: 'Carga para freidoras y plancha' },
  { concepto: 'Internet de Alta Velocidad y Teléfono', categoria: 'Servicios', monto: 799.00, fecha_gasto: '2026-11-04', metodo_pago: 'Tarjeta de Débito', comprobante_referencia: 'TEL-55928', notas: 'Paquete comercial 200 Mbps' },
  { concepto: 'Insumos de Limpieza y Sanitización Profesional', categoria: 'Insumos Limpieza', monto: 1250.00, fecha_gasto: '2026-11-05', metodo_pago: 'Efectivo', comprobante_referencia: 'TICKET-8821', notas: 'Desengrasantes, cloro, toallas y jabón' },
  { concepto: 'Cajas de Hamburguesa y Empaques Térmicos', categoria: 'Empaques', monto: 2100.00, fecha_gasto: '2026-11-06', metodo_pago: 'Transferencia', comprobante_referencia: 'FAC-EMP-102', notas: 'Lote de 500 cajas biodegradables y papel grado alimenticio' }
];

const empleadosIniciales = [
  { nombre: 'Carlos Mendoza', puesto: 'Chef / Cocinero Principal', telefono: '55-1234-5678', sueldo_diario: 550.00, fecha_ingreso: '2026-01-15', estado: 'Activo', experiencia_laboral: '5 años en cocina rápida y gourmet' },
  { nombre: 'Brenda Morales', puesto: 'Cajera y Atención', telefono: '55-8765-4321', sueldo_diario: 380.00, fecha_ingreso: '2026-03-01', estado: 'Activo', experiencia_laboral: 'Manejo de TPV y arqueo de caja' },
  { nombre: 'Javier Ortiz', puesto: 'Parrillero Especialista', telefono: '55-4321-8765', sueldo_diario: 450.00, fecha_ingreso: '2026-02-10', estado: 'Activo', experiencia_laboral: 'Parrilla al carbón y plancha smash' },
  { nombre: 'Sofía Ramírez', puesto: 'Mesera / Atención en Sala', telefono: '55-6789-1234', sueldo_diario: 320.00, fecha_ingreso: '2026-04-20', estado: 'Activo', experiencia_laboral: 'Servicio a comensales y comandas' },
  { nombre: 'Mateo Flores', puesto: 'Ayudante de Cocina y Limpieza', telefono: '55-9876-5432', sueldo_diario: 300.00, fecha_ingreso: '2026-05-12', estado: 'Activo', experiencia_laboral: 'Mise en place y desinfección' }
];

const proveedoresIniciales = [
  { nombre_comercial: 'Carnicería & Empacadora La Selecta', razon_social: 'Distribuidora Cárnica del Norte S.A. de C.V.', contacto_nombre: 'Ing. Roberto Garza', telefono: '55-4433-2211', email: 'ventas@laselectacarnes.com', direccion: 'Av. Rastro Central #102, Bodega 4', categoria_suministro: 'Carnes y Aves', dias_entrega: 'Lunes, Miércoles y Viernes', estado: 'Activo', notas: 'Cortes premium para hamburguesa 80/20 y pechuga fresca' },
  { nombre_comercial: 'Distribuidora Agrícola San Juan', razon_social: 'Comercializadora Frutas y Legumbres S.A.', contacto_nombre: 'Lic. Claudia Mendoza', telefono: '55-8899-7766', email: 'pedidos@agricolasanjuan.com', direccion: 'Central de Abastos, Pasillo I-22', categoria_suministro: 'Frutas y Verduras', dias_entrega: 'Martes, Jueves y Sábados', estado: 'Activo', notas: 'Tomate saladette, cebolla blanca y lechuga romana fresca' },
  { nombre_comercial: 'Panificadora & Brioche El Molino', razon_social: 'Panadería Artesanal El Molino S. de R.L.', contacto_nombre: 'Don Fernando Silva', telefono: '55-3322-1100', email: 'contacto@panaderiaelmolino.mx', direccion: 'Calle Horno #45, Col. Industrial', categoria_suministro: 'Panadería y Masas', dias_entrega: 'Lunes a Sábado (7:00 AM)', estado: 'Activo', notas: 'Pan brioche con ajonjolí horneado el mismo día' },
  { nombre_comercial: 'Lácteos & Quesos Santa Clara', razon_social: 'Distribuidora de Lácteos del Centro S.A.', contacto_nombre: 'Mariana Reyes', telefono: '55-7788-9900', email: 'ventas@lacteossantaclara.com', direccion: 'Parque Logístico Frío, Nave 2', categoria_suministro: 'Lácteos y Quesos', dias_entrega: 'Miércoles y Sábados', estado: 'Activo', notas: 'Queso cheddar americano y aderezos especiales' },
  { nombre_comercial: 'Empaques Biodegradables GreenPack', razon_social: 'Soluciones Ecológicas de Empaque S.A.', contacto_nombre: 'Arturo Benítez', telefono: '55-6655-4433', email: 'pedidos@greenpack.mx', direccion: 'Av. Industria Ligera #88', categoria_suministro: 'Empaques y Desechables', dias_entrega: 'Bajo Pedido (48 hrs)', estado: 'Activo', notas: 'Cajas térmicas para hamburguesa, papel antigrasa y bolsas kraft' },
  { nombre_comercial: 'Gas Imperial Comercial', razon_social: 'Gas Imperial de México S.A. de C.V.', contacto_nombre: 'Servicio al Cliente', telefono: '55-2233-4455', email: 'comercial@gasimperial.com', direccion: 'Carretera Federal Km 14', categoria_suministro: 'Servicios y Gas', dias_entrega: 'Lunes a Domingo (24 hrs)', estado: 'Activo', notas: 'Suministro de cilindros 45kg y tanque estacionario' }
];

const usuariosIniciales = [
  { nombre_completo: 'Administrador del Sistema', username: 'admin', email: 'admin@fooderp.com', password_hash: hashPwd('admin123'), rol: 'Administrador', estado: 'Activo' },
  { nombre_completo: 'Brenda Morales (Caja)', username: 'cajero', email: 'caja@fooderp.com', password_hash: hashPwd('caja123'), rol: 'Cajero', estado: 'Activo' },
  { nombre_completo: 'Carlos Mendoza (Cocina)', username: 'cocina', email: 'cocina@fooderp.com', password_hash: hashPwd('cocina123'), rol: 'Almacen', estado: 'Activo' }
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

    // Asegurar y sembrar tabla GASTOS_OPERATIVOS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS GASTOS_OPERATIVOS (
        id_gasto INT AUTO_INCREMENT PRIMARY KEY,
        concepto VARCHAR(150) NOT NULL,
        categoria VARCHAR(60) NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        fecha_gasto DATE NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL,
        comprobante_referencia VARCHAR(100),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [gastosRows] = await pool.query('SELECT COUNT(*) as total FROM GASTOS_OPERATIVOS');
    if (gastosRows[0].total === 0) {
      console.log('Sembrando gastos operativos iniciales...');
      for (const g of gastosOperativosIniciales) {
        await pool.query(
          'INSERT INTO GASTOS_OPERATIVOS (concepto, categoria, monto, fecha_gasto, metodo_pago, comprobante_referencia, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [g.concepto, g.categoria, g.monto, g.fecha_gasto, g.metodo_pago, g.comprobante_referencia, g.notas]
        );
      }
      console.log('✓ 6 Gastos operativos iniciales insertados en GASTOS_OPERATIVOS.');
    }

    // Asegurar estructura de EMPLEADOS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS EMPLEADOS (
        id_empleado INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        puesto VARCHAR(100) DEFAULT 'General',
        experiencia_laboral VARCHAR(255),
        telefono VARCHAR(30),
        sueldo_diario DECIMAL(10,2) NOT NULL,
        fecha_ingreso DATE NOT NULL,
        estado VARCHAR(30) DEFAULT 'Activo'
      )
    `);

    try {
      await pool.query('ALTER TABLE EMPLEADOS ADD COLUMN puesto VARCHAR(100) DEFAULT "General"');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE EMPLEADOS ADD COLUMN telefono VARCHAR(30)');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE EMPLEADOS ADD COLUMN estado VARCHAR(30) DEFAULT "Activo"');
    } catch (e) {}

    // Asegurar estructura de PAGOS_EMPLEADOS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PAGOS_EMPLEADOS (
        id_pago INT AUTO_INCREMENT PRIMARY KEY,
        id_empleado INT NOT NULL,
        fecha_pago DATE NOT NULL,
        periodo VARCHAR(80) NOT NULL,
        dias_trabajados INT NOT NULL,
        sueldo_diario DECIMAL(10,2) NOT NULL,
        bonos DECIMAL(10,2) DEFAULT 0.00,
        deducciones DECIMAL(10,2) DEFAULT 0.00,
        total_pagado DECIMAL(10,2) NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pagos_empleado
          FOREIGN KEY (id_empleado) REFERENCES EMPLEADOS(id_empleado)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `);

    try {
      await pool.query('ALTER TABLE PAGOS_EMPLEADOS ADD COLUMN bonos DECIMAL(10,2) DEFAULT 0.00');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE PAGOS_EMPLEADOS ADD COLUMN deducciones DECIMAL(10,2) DEFAULT 0.00');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE PAGOS_EMPLEADOS ADD COLUMN notas TEXT');
    } catch (e) {}

    // Sembrar empleados iniciales si está vacío
    const [empRows] = await pool.query('SELECT COUNT(*) as total FROM EMPLEADOS');
    if (empRows[0].total === 0) {
      console.log('Sembrando colaboradores iniciales del restaurante en EMPLEADOS...');
      for (const emp of empleadosIniciales) {
        await pool.query(
          'INSERT INTO EMPLEADOS (nombre, puesto, telefono, sueldo_diario, fecha_ingreso, estado, experiencia_laboral) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [emp.nombre, emp.puesto, emp.telefono, emp.sueldo_diario, emp.fecha_ingreso, emp.estado, emp.experiencia_laboral]
        );
      }
      console.log('✓ 5 Colaboradores iniciales insertados en EMPLEADOS.');
    }

    // Asegurar estructura de PROVEEDORES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PROVEEDORES (
        id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
        nombre_comercial VARCHAR(150) NOT NULL,
        razon_social VARCHAR(150),
        contacto_nombre VARCHAR(120),
        telefono VARCHAR(30) NOT NULL,
        email VARCHAR(120),
        direccion VARCHAR(255),
        categoria_suministro VARCHAR(80) NOT NULL,
        dias_entrega VARCHAR(100),
        estado VARCHAR(30) DEFAULT 'Activo',
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sembrar proveedores iniciales si está vacío
    const [provRows] = await pool.query('SELECT COUNT(*) as total FROM PROVEEDORES');
    if (provRows[0].total === 0) {
      console.log('Sembrando directorio inicial de proveedores...');
      for (const prov of proveedoresIniciales) {
        await pool.query(
          'INSERT INTO PROVEEDORES (nombre_comercial, razon_social, contacto_nombre, telefono, email, direccion, categoria_suministro, dias_entrega, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [prov.nombre_comercial, prov.razon_social, prov.contacto_nombre, prov.telefono, prov.email, prov.direccion, prov.categoria_suministro, prov.dias_entrega, prov.estado, prov.notas]
        );
      }
      console.log('✓ 6 Distribuidores iniciales insertados en PROVEEDORES.');
    }

    // Asegurar estructura de USUARIOS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS USUARIOS (
        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
        nombre_completo VARCHAR(150) NOT NULL,
        nombre_negocio VARCHAR(150) DEFAULT 'FoodERP Restaurant',
        username VARCHAR(60) NOT NULL UNIQUE,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'Administrador',
        estado VARCHAR(30) DEFAULT 'Activo',
        tema_preferido VARCHAR(30) DEFAULT 'nvidia-dark',
        ultimo_acceso DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.query('ALTER TABLE USUARIOS ADD COLUMN nombre_negocio VARCHAR(150) DEFAULT "FoodERP Restaurant"');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE USUARIOS ADD COLUMN tema_preferido VARCHAR(30) DEFAULT "nvidia-dark"');
    } catch (e) {}

    // Sembrar usuarios iniciales si está vacío
    const [userRows] = await pool.query('SELECT COUNT(*) as total FROM USUARIOS');
    if (userRows[0].total === 0) {
      console.log('Sembrando cuentas de usuario iniciales...');
      for (const u of usuariosIniciales) {
        await pool.query(
          'INSERT INTO USUARIOS (nombre_completo, username, email, password_hash, rol, estado, nombre_negocio, tema_preferido) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [u.nombre_completo, u.username, u.email, u.password_hash, u.rol, u.estado, 'FoodERP Restaurant', 'nvidia-dark']
        );
      }
      console.log('✓ 3 Usuarios iniciales creados en USUARIOS.');
    }

    // Asegurar la cuenta maestra de Fernando Ramírez (SuperAdmin) y migrar datos
    let idFernando = null;
    const [fernandoUser] = await pool.query('SELECT id_usuario, rol FROM USUARIOS WHERE email = ?', ['fernandoramirez@gmail.com']);
    if (fernandoUser.length > 0) {
      idFernando = fernandoUser[0].id_usuario;
      if (fernandoUser[0].rol !== 'SuperAdmin') {
        await pool.query('UPDATE USUARIOS SET rol = "SuperAdmin" WHERE id_usuario = ?', [idFernando]);
        console.log(`✓ Rol de Fernando Ramírez actualizado a SuperAdmin (ID: ${idFernando})`);
      }
    } else {
      console.log('Creando cuenta principal de Fernando Ramírez como SuperAdmin...');
      const [insertFernando] = await pool.query(
        `INSERT INTO USUARIOS (nombre_completo, nombre_negocio, username, email, password_hash, rol, estado, tema_preferido) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Fernando Ramírez',
          'FoodERP Restaurant & Gourmet',
          'fernandoramirez',
          'fernandoramirez@gmail.com',
          hashPwd('Admin123!'),
          'SuperAdmin',
          'Activo',
          'nvidia-dark'
        ]
      );
      idFernando = insertFernando.insertId;
      console.log(`✓ Cuenta principal SuperAdmin creada: fernandoramirez@gmail.com (ID: ${idFernando})`);
    }

    // Asegurar columna id_usuario en todas las tablas y migrar registros existentes a Fernando
    const tablasTenant = [
      'MATERIA_PRIMA',
      'PRODUCTOS',
      'VENTAS',
      'COMPRAS_MATERIA_PRIMA',
      'DESPERDICIOS',
      'GASTOS_OPERATIVOS',
      'EMPLEADOS',
      'PAGOS_EMPLEADOS',
      'PROVEEDORES'
    ];

    for (const tabla of tablasTenant) {
      try {
        await pool.query(`ALTER TABLE ${tabla} ADD COLUMN id_usuario INT`);
      } catch (e) {}

      if (idFernando) {
        await pool.query(`UPDATE ${tabla} SET id_usuario = ? WHERE id_usuario IS NULL OR id_usuario = 0`, [idFernando]);
      }
    }
    console.log(`✓ Migración multi-tenant completada: datos vinculados al usuario ID ${idFernando} (fernandoramirez@gmail.com)`);
  } catch (error) {
    console.error('Error al verificar o sembrar datos:', error);
  }
};

module.exports = { seedMateriaPrima };
