-- =========================================================
-- Base de datos: Finanzas_BD
-- Sistema Multi-Tenant de Administración de Restaurante / Negocio de Comida
-- Aislamiento de datos por id_usuario y compatibilidad total
-- =========================================================

DROP DATABASE IF EXISTS Finanzas_BD;
CREATE DATABASE Finanzas_BD
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Finanzas_BD;

-- =========================================================
-- Tabla: USUARIOS
-- Cuentas de usuario, personalización de negocio y temas visuales
-- =========================================================
CREATE TABLE IF NOT EXISTS USUARIOS (
    id_usuario             INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo        VARCHAR(150) NOT NULL,
    nombre_negocio         VARCHAR(150) DEFAULT 'FoodERP Restaurant & Gourmet',
    username               VARCHAR(60) NOT NULL UNIQUE,
    email                  VARCHAR(120) NOT NULL UNIQUE,
    password_hash          VARCHAR(255) NOT NULL,
    rol                    VARCHAR(50) DEFAULT 'Administrador',
    estado                 VARCHAR(30) DEFAULT 'Activo',
    tema_preferido         VARCHAR(30) DEFAULT 'nvidia-dark',
    ultimo_acceso          DATETIME,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Tabla: EMPLEADOS
-- =========================================================
CREATE TABLE EMPLEADOS (
    id_empleado            INT AUTO_INCREMENT PRIMARY KEY,
    nombre                 VARCHAR(150) NOT NULL,
    puesto                 VARCHAR(100) DEFAULT 'General',
    telefono               VARCHAR(30),
    sueldo_diario          DECIMAL(10,2) NOT NULL,
    fecha_ingreso          DATE NOT NULL,
    estado                 VARCHAR(30) DEFAULT 'Activo',
    experiencia_laboral    VARCHAR(255),
    id_usuario             INT,
    CONSTRAINT fk_empleados_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: MATERIA_PRIMA
-- =========================================================
CREATE TABLE MATERIA_PRIMA (
    id_materia_prima       INT AUTO_INCREMENT PRIMARY KEY,
    nombre                 VARCHAR(150) NOT NULL,
    unidad_medida          VARCHAR(50) NOT NULL,
    cantidad_disponible    DECIMAL(10,2) NOT NULL,
    costo_unitario         DECIMAL(10,2) NOT NULL,
    estado                 VARCHAR(50) NOT NULL,
    id_usuario             INT,
    CONSTRAINT fk_materia_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: PRODUCTOS
-- =========================================================
CREATE TABLE PRODUCTOS (
    id_producto            INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto        VARCHAR(150) NOT NULL,
    descripcion            VARCHAR(255),
    precio                 DECIMAL(10,2) NOT NULL,
    estado                 VARCHAR(50) NOT NULL,
    id_usuario             INT,
    CONSTRAINT fk_productos_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: VENTAS
-- =========================================================
CREATE TABLE VENTAS (
    id_venta               INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta            DATE NOT NULL,
    total                  DECIMAL(10,2) NOT NULL,
    metodo_pago            VARCHAR(50) NOT NULL,
    id_usuario             INT,
    CONSTRAINT fk_ventas_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: PAGOS_EMPLEADOS
-- =========================================================
CREATE TABLE PAGOS_EMPLEADOS (
    id_pago                INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado            INT NOT NULL,
    fecha_pago             DATE NOT NULL,
    periodo                VARCHAR(80) NOT NULL,
    dias_trabajados        INT NOT NULL,
    sueldo_diario          DECIMAL(10,2) NOT NULL,
    bonos                  DECIMAL(10,2) DEFAULT 0.00,
    deducciones            DECIMAL(10,2) DEFAULT 0.00,
    total_pagado           DECIMAL(10,2) NOT NULL,
    metodo_pago            VARCHAR(50) NOT NULL,
    notas                  TEXT,
    id_usuario             INT,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pagos_empleado
        FOREIGN KEY (id_empleado) REFERENCES EMPLEADOS(id_empleado)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: DETALLE_VENTA
-- =========================================================
CREATE TABLE DETALLE_VENTA (
    id_detalle             INT AUTO_INCREMENT PRIMARY KEY,
    id_venta               INT NOT NULL,
    id_producto            INT NOT NULL,
    cantidad               INT NOT NULL,
    precio_unitario        DECIMAL(10,2) NOT NULL,
    subtotal               DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta) REFERENCES VENTAS(id_venta)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: PRODUCTO_MATERIA_PRIMA
-- =========================================================
CREATE TABLE PRODUCTO_MATERIA_PRIMA (
    id_producto            INT NOT NULL,
    id_materia_prima       INT NOT NULL,
    cantidad_necesaria     DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id_producto, id_materia_prima),
    CONSTRAINT fk_pmp_producto
        FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_pmp_materia_prima
        FOREIGN KEY (id_materia_prima) REFERENCES MATERIA_PRIMA(id_materia_prima)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: COMPRAS_MATERIA_PRIMA
-- =========================================================
CREATE TABLE COMPRAS_MATERIA_PRIMA (
    id_compra              INT AUTO_INCREMENT PRIMARY KEY,
    id_materia_prima       INT NOT NULL,
    fecha_compra           DATE NOT NULL,
    cantidad               DECIMAL(10,2) NOT NULL,
    costo_total            DECIMAL(10,2) NOT NULL,
    id_usuario             INT,
    CONSTRAINT fk_compras_materia_prima
        FOREIGN KEY (id_materia_prima) REFERENCES MATERIA_PRIMA(id_materia_prima)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: DESPERDICIOS
-- =========================================================
CREATE TABLE DESPERDICIOS (
    id_desperdicio         INT AUTO_INCREMENT PRIMARY KEY,
    id_materia_prima       INT NOT NULL,
    fecha                  DATE NOT NULL,
    cantidad_desperdiciada DECIMAL(10,2) NOT NULL,
    porcentaje_desperdicio DECIMAL(5,2) NOT NULL,
    motivo                 VARCHAR(255),
    id_usuario             INT,
    CONSTRAINT fk_desperdicios_materia_prima
        FOREIGN KEY (id_materia_prima) REFERENCES MATERIA_PRIMA(id_materia_prima)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: GASTOS_OPERATIVOS
-- =========================================================
CREATE TABLE IF NOT EXISTS GASTOS_OPERATIVOS (
    id_gasto               INT AUTO_INCREMENT PRIMARY KEY,
    concepto               VARCHAR(150) NOT NULL,
    categoria              VARCHAR(60) NOT NULL,
    monto                  DECIMAL(10,2) NOT NULL,
    fecha_gasto            DATE NOT NULL,
    metodo_pago            VARCHAR(50) NOT NULL,
    comprobante_referencia VARCHAR(100),
    notas                  TEXT,
    id_usuario             INT,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- Tabla: PROVEEDORES
-- =========================================================
CREATE TABLE IF NOT EXISTS PROVEEDORES (
    id_proveedor           INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial       VARCHAR(150) NOT NULL,
    razon_social           VARCHAR(150),
    contacto_nombre        VARCHAR(120),
    telefono               VARCHAR(30) NOT NULL,
    email                  VARCHAR(120),
    direccion              VARCHAR(255),
    categoria_suministro   VARCHAR(80) NOT NULL,
    dias_entrega           VARCHAR(100),
    estado                 VARCHAR(30) DEFAULT 'Activo',
    notas                  TEXT,
    id_usuario             INT,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
