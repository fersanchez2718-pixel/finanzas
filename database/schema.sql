-- =========================================================
-- Base de datos: Finanzas_BD
-- Generado a partir del diagrama ER (sistema de administración
-- de negocio de comida: materia prima, gastos, sueldos y ventas)
-- =========================================================

DROP DATABASE IF EXISTS Finanzas_BD;
CREATE DATABASE Finanzas_BD
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Finanzas_BD;

-- =========================================================
-- Tabla: EMPLEADOS
-- =========================================================
CREATE TABLE EMPLEADOS (
    id_empleado        INT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(150) NOT NULL,
    experiencia_laboral VARCHAR(255),
    sueldo_diario      DECIMAL(10,2) NOT NULL,
    fecha_ingreso      DATE NOT NULL
);

-- =========================================================
-- Tabla: VENTAS
-- =========================================================
CREATE TABLE VENTAS (
    id_venta       INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta    DATE NOT NULL,
    total          DECIMAL(10,2) NOT NULL,
    metodo_pago    VARCHAR(50) NOT NULL
);

-- =========================================================
-- Tabla: PRODUCTOS
-- =========================================================
CREATE TABLE PRODUCTOS (
    id_producto      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto  VARCHAR(150) NOT NULL,
    descripcion      VARCHAR(255),
    precio           DECIMAL(10,2) NOT NULL,
    estado           VARCHAR(50) NOT NULL
);

-- =========================================================
-- Tabla: MATERIA_PRIMA
-- =========================================================
CREATE TABLE MATERIA_PRIMA (
    id_materia_prima     INT AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(150) NOT NULL,
    unidad_medida        VARCHAR(50) NOT NULL,
    cantidad_disponible  DECIMAL(10,2) NOT NULL,
    costo_unitario       DECIMAL(10,2) NOT NULL,
    estado               VARCHAR(50) NOT NULL
);

-- =========================================================
-- Tabla: PAGOS_EMPLEADOS
-- Relación "recibe": EMPLEADOS (1) -> PAGOS_EMPLEADOS (N)
-- =========================================================
CREATE TABLE PAGOS_EMPLEADOS (
    id_pago        INT AUTO_INCREMENT PRIMARY KEY,
    id_empleado    INT NOT NULL,
    fecha_pago     DATE NOT NULL,
    periodo        VARCHAR(50) NOT NULL,
    dias_trabajados INT NOT NULL,
    sueldo_diario  DECIMAL(10,2) NOT NULL,
    total_pagado   DECIMAL(10,2) NOT NULL,
    metodo_pago    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_pagos_empleado
        FOREIGN KEY (id_empleado) REFERENCES EMPLEADOS(id_empleado)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: DETALLE_VENTA
-- Relación "contiene": VENTAS (1) -> DETALLE_VENTA (N)
-- Relación "incluye": PRODUCTOS (1) -> DETALLE_VENTA (N)
-- =========================================================
CREATE TABLE DETALLE_VENTA (
    id_detalle       INT AUTO_INCREMENT PRIMARY KEY,
    id_venta         INT NOT NULL,
    id_producto      INT NOT NULL,
    cantidad         INT NOT NULL,
    precio_unitario  DECIMAL(10,2) NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL,
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
-- Relación "utiliza": PRODUCTOS (1) -> PRODUCTO_MATERIA_PRIMA (N)
-- Relación "utiliza": MATERIA_PRIMA (1) -> PRODUCTO_MATERIA_PRIMA (N)
-- Clave primaria compuesta
-- =========================================================
CREATE TABLE PRODUCTO_MATERIA_PRIMA (
    id_producto        INT NOT NULL,
    id_materia_prima   INT NOT NULL,
    cantidad_necesaria DECIMAL(10,2) NOT NULL,
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
-- Relación "tiene": MATERIA_PRIMA (1) -> COMPRAS_MATERIA_PRIMA (N)
-- =========================================================
CREATE TABLE COMPRAS_MATERIA_PRIMA (
    id_compra        INT AUTO_INCREMENT PRIMARY KEY,
    id_materia_prima INT NOT NULL,
    fecha_compra     DATE NOT NULL,
    cantidad         DECIMAL(10,2) NOT NULL,
    costo_total      DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_compras_materia_prima
        FOREIGN KEY (id_materia_prima) REFERENCES MATERIA_PRIMA(id_materia_prima)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================================================
-- Tabla: DESPERDICIOS
-- Relación "registra": MATERIA_PRIMA (1) -> DESPERDICIOS (N)
-- =========================================================
CREATE TABLE DESPERDICIOS (
    id_desperdicio        INT AUTO_INCREMENT PRIMARY KEY,
    id_materia_prima      INT NOT NULL,
    fecha                 DATE NOT NULL,
    cantidad_desperdiciada DECIMAL(10,2) NOT NULL,
    porcentaje_desperdicio DECIMAL(5,2) NOT NULL,
    motivo                VARCHAR(255),
    CONSTRAINT fk_desperdicios_materia_prima
        FOREIGN KEY (id_materia_prima) REFERENCES MATERIA_PRIMA(id_materia_prima)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
