-- OPCION A: Base de datos EXISTENTE con las 12 tablas ya creadas.
-- El nombre predeterminado es finanzas_bd: cambiar USE si tu BD tiene otro nombre.
-- Conserva las tablas, datos, claves e indices de la BD que ya tienes.
-- ATENCION: reemplaza solamente los 5 triggers, 5 funciones, 5 procedimientos y 5 vistas con estos mismos nombres.
-- Antes de usarlo, guarda un respaldo desde phpMyAdmin.

-- Compatible con MySQL 8.0.17 / phpMyAdmin 4.9.1
-- Elaborado a partir del SQL compartido. No elimina tablas ni registros.
SET NAMES utf8mb4;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

USE `finanzas_bd`;

-- ------------------------------------------------------------------------
-- REEMPLAZAR OBJETOS EXISTENTES
-- ------------------------------------------------------------------------

DROP TRIGGER IF EXISTS `trg_compra_suma_stock`;
DROP TRIGGER IF EXISTS `trg_desperdicio_resta_stock`;
DROP TRIGGER IF EXISTS `trg_detalle_subtotal`;
DROP TRIGGER IF EXISTS `trg_detalle_total_venta`;
DROP TRIGGER IF EXISTS `trg_pago_total`;
DROP PROCEDURE IF EXISTS `sp_agregar_detalle`;
DROP PROCEDURE IF EXISTS `sp_registrar_compra`;
DROP PROCEDURE IF EXISTS `sp_registrar_desperdicio`;
DROP PROCEDURE IF EXISTS `sp_registrar_pago`;
DROP PROCEDURE IF EXISTS `sp_registrar_venta`;
DROP FUNCTION IF EXISTS `fn_calcular_pago`;
DROP FUNCTION IF EXISTS `fn_costo_producto`;
DROP FUNCTION IF EXISTS `fn_stock_materia`;
DROP FUNCTION IF EXISTS `fn_total_venta`;
DROP FUNCTION IF EXISTS `fn_ventas_del_dia`;
DROP VIEW IF EXISTS `detalles_venta_vista`;
DROP VIEW IF EXISTS `inventario_bajo`;
DROP VIEW IF EXISTS `mas_vendidos`;
DROP VIEW IF EXISTS `pagos_empleados_vista`;
DROP VIEW IF EXISTS `venta_diaria`;

DELIMITER $$

-- ------------------------------------------------------------------------
-- 1. FUNCIONES
-- ------------------------------------------------------------------------

CREATE FUNCTION `fn_calcular_pago` (`p_sueldo` DECIMAL(10,2), `p_dias` INT) RETURNS DECIMAL(10,2) DETERMINISTIC NO SQL
BEGIN
    RETURN p_sueldo * p_dias;
END$$

CREATE FUNCTION `fn_costo_producto` (`p_id_producto` INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT IFNULL(SUM(pmp.cantidad_necesaria * mp.costo_unitario), 0)
            FROM producto_materia_prima pmp
            JOIN materia_prima mp ON mp.id_materia_prima = pmp.id_materia_prima
            WHERE pmp.id_producto = p_id_producto);
END$$

CREATE FUNCTION `fn_stock_materia` (`p_id_materia` INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT cantidad_disponible
            FROM materia_prima
            WHERE id_materia_prima = p_id_materia);
END$$

CREATE FUNCTION `fn_total_venta` (`p_id_venta` INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT IFNULL(SUM(subtotal), 0)
            FROM detalle_venta
            WHERE id_venta = p_id_venta);
END$$

CREATE FUNCTION `fn_ventas_del_dia` (`p_fecha` DATE) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT IFNULL(SUM(total), 0)
            FROM ventas
            WHERE fecha_venta = p_fecha);
END$$

-- ------------------------------------------------------------------------
-- 2. PROCEDIMIENTOS
-- ------------------------------------------------------------------------

CREATE PROCEDURE `sp_agregar_detalle` (
    IN `p_id_venta` INT,
    IN `p_id_producto` INT,
    IN `p_cantidad` INT
)
BEGIN
    DECLARE v_precio DECIMAL(10,2);

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor a cero';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ventas WHERE id_venta = p_id_venta) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La venta no existe';
    END IF;

    SELECT precio INTO v_precio
    FROM productos
    WHERE id_producto = p_id_producto;

    IF v_precio IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El producto no existe';
    END IF;

    -- El trigger trg_detalle_subtotal calcula el subtotal, y
    -- trg_detalle_total_venta actualiza el total de ventas.
    INSERT INTO detalle_venta
        (id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES
        (p_id_venta, p_id_producto, p_cantidad, v_precio, 0);
END$$

CREATE PROCEDURE `sp_registrar_compra` (
    IN `p_id_materia` INT,
    IN `p_cantidad` DECIMAL(10,2),
    IN `p_costo_total` DECIMAL(10,2)
)
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor a cero';
    END IF;
    IF p_costo_total IS NULL OR p_costo_total < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El costo no puede ser negativo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM materia_prima WHERE id_materia_prima = p_id_materia) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La materia prima no existe';
    END IF;

    INSERT INTO compras_materia_prima
        (id_materia_prima, fecha_compra, cantidad, costo_total)
    VALUES
        (p_id_materia, CURDATE(), p_cantidad, p_costo_total);
END$$

CREATE PROCEDURE `sp_registrar_desperdicio` (
    IN `p_id_materia` INT,
    IN `p_cantidad` DECIMAL(10,2),
    IN `p_motivo` VARCHAR(255)
)
BEGIN
    DECLARE v_porcentaje DECIMAL(5,2);
    DECLARE v_stock DECIMAL(10,2);

    SELECT cantidad_disponible INTO v_stock
    FROM materia_prima
    WHERE id_materia_prima = p_id_materia;

    IF v_stock IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La materia prima no existe';
    END IF;

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor a cero';
    END IF;

    IF v_stock <= 0 OR p_cantidad > v_stock THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay stock suficiente para registrar el desperdicio';
    END IF;

    SET v_porcentaje = (p_cantidad / v_stock) * 100;

    INSERT INTO desperdicios
        (id_materia_prima, fecha, cantidad_desperdiciada, porcentaje_desperdicio, motivo)
    VALUES
        (p_id_materia, CURDATE(), p_cantidad, v_porcentaje, p_motivo);
END$$

CREATE PROCEDURE `sp_registrar_pago` (
    IN `p_id_empleado` INT,
    IN `p_periodo` VARCHAR(50),
    IN `p_dias` INT,
    IN `p_metodo_pago` VARCHAR(50)
)
BEGIN
    DECLARE v_sueldo DECIMAL(10,2);

    IF p_dias IS NULL OR p_dias <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Los dias deben ser mayores a cero';
    END IF;

    SELECT sueldo_diario INTO v_sueldo
    FROM empleados
    WHERE id_empleado = p_id_empleado;

    IF v_sueldo IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El empleado no existe';
    END IF;

    -- El trigger trg_pago_total determina total_pagado.
    INSERT INTO pagos_empleados
        (id_empleado, fecha_pago, periodo, dias_trabajados, sueldo_diario, total_pagado, metodo_pago)
    VALUES
        (p_id_empleado, CURDATE(), p_periodo, p_dias, v_sueldo, 0, p_metodo_pago);
END$$

CREATE PROCEDURE `sp_registrar_venta` (IN `p_metodo_pago` VARCHAR(50))  BEGIN
    INSERT INTO ventas (fecha_venta, total, metodo_pago)
    VALUES (CURDATE(), 0, p_metodo_pago);

    SELECT LAST_INSERT_ID() AS id_venta;
END$$

-- ------------------------------------------------------------------------
-- 3. TRIGGERS
-- ------------------------------------------------------------------------

CREATE TRIGGER `trg_compra_suma_stock` AFTER INSERT ON `compras_materia_prima` FOR EACH ROW BEGIN
    UPDATE materia_prima
    SET cantidad_disponible = cantidad_disponible + NEW.cantidad
    WHERE id_materia_prima = NEW.id_materia_prima;
END
$$

CREATE TRIGGER `trg_desperdicio_resta_stock` AFTER INSERT ON `desperdicios` FOR EACH ROW BEGIN
    UPDATE materia_prima
    SET cantidad_disponible = cantidad_disponible - NEW.cantidad_desperdiciada
    WHERE id_materia_prima = NEW.id_materia_prima;
END
$$

CREATE TRIGGER `trg_detalle_subtotal` BEFORE INSERT ON `detalle_venta` FOR EACH ROW BEGIN
    SET NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
END
$$

CREATE TRIGGER `trg_detalle_total_venta` AFTER INSERT ON `detalle_venta` FOR EACH ROW BEGIN
    UPDATE ventas
    SET total = total + NEW.subtotal
    WHERE id_venta = NEW.id_venta;
END
$$

CREATE TRIGGER `trg_pago_total` BEFORE INSERT ON `pagos_empleados` FOR EACH ROW BEGIN
    SET NEW.total_pagado = fn_calcular_pago(NEW.sueldo_diario, NEW.dias_trabajados);
END
$$

DELIMITER ;

-- ------------------------------------------------------------------------
-- 4. VISTAS
-- ------------------------------------------------------------------------

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `detalles_venta_vista` AS
  SELECT `v`.`id_venta` AS `id_venta`,
         `v`.`fecha_venta` AS `fecha_venta`,
         `p`.`nombre_producto` AS `nombre_producto`,
         `dv`.`cantidad` AS `cantidad`,
         `dv`.`precio_unitario` AS `precio_unitario`,
         `dv`.`subtotal` AS `subtotal`
  FROM ((`ventas` `v`
    JOIN `detalle_venta` `dv` ON (`dv`.`id_venta` = `v`.`id_venta`))
    JOIN `productos` `p` ON (`p`.`id_producto` = `dv`.`id_producto`));

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `inventario_bajo` AS
  SELECT `materia_prima`.`nombre` AS `nombre`,
         `materia_prima`.`unidad_medida` AS `unidad_medida`,
         `materia_prima`.`cantidad_disponible` AS `cantidad_disponible`
  FROM `materia_prima`
  WHERE `materia_prima`.`cantidad_disponible` <= 10;

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `mas_vendidos` AS
  SELECT `p`.`nombre_producto` AS `nombre_producto`,
         SUM(`dv`.`cantidad`) AS `unidades_vendidas`
  FROM (`detalle_venta` `dv`
    JOIN `productos` `p` ON (`p`.`id_producto` = `dv`.`id_producto`))
  GROUP BY `p`.`nombre_producto`
  ORDER BY `unidades_vendidas` DESC;

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `pagos_empleados_vista` AS
  SELECT `e`.`nombre` AS `nombre`,
         `pe`.`fecha_pago` AS `fecha_pago`,
         `pe`.`periodo` AS `periodo`,
         `pe`.`dias_trabajados` AS `dias_trabajados`,
         `pe`.`total_pagado` AS `total_pagado`
  FROM (`pagos_empleados` `pe`
    JOIN `empleados` `e` ON (`e`.`id_empleado` = `pe`.`id_empleado`));

CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `venta_diaria` AS
  SELECT `ventas`.`fecha_venta` AS `fecha_venta`,
         COUNT(0) AS `num_ventas`,
         SUM(`ventas`.`total`) AS `total_vendido`
  FROM `ventas`
  GROUP BY `ventas`.`fecha_venta`;

-- FIN. No se ejecuta ningun INSERT, UPDATE o DELETE sobre datos.
