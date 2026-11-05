-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 03-11-2026 a las 23:12:49
-- Versión del servidor: 8.0.17
-- Versión de PHP: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `finanzas_bd_respaldo`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_agregar_detalle` (IN `p_id_venta` INT, IN `p_id_producto` INT, IN `p_cantidad` INT)  BEGIN
    DECLARE v_precio DECIMAL(10,2);
 
    SELECT precio INTO v_precio
    FROM productos
    WHERE id_producto = p_id_producto;
 
    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (p_id_venta, p_id_producto, p_cantidad, v_precio, 0);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_compra` (IN `p_id_materia` INT, IN `p_cantidad` DECIMAL(10,2), IN `p_costo_total` DECIMAL(10,2))  BEGIN
    INSERT INTO compras_materia_prima (id_materia_prima, fecha_compra, cantidad, costo_total)
    VALUES (p_id_materia, CURDATE(), p_cantidad, p_costo_total);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_desperdicio` (IN `p_id_materia` INT, IN `p_cantidad` DECIMAL(10,2), IN `p_motivo` VARCHAR(255))  BEGIN
    DECLARE v_porcentaje DECIMAL(5,2);
 
    SET v_porcentaje = (p_cantidad / fn_stock_materia(p_id_materia)) * 100;
 
    INSERT INTO desperdicios (id_materia_prima, fecha, cantidad_desperdiciada, porcentaje_desperdicio, motivo)
    VALUES (p_id_materia, CURDATE(), p_cantidad, v_porcentaje, p_motivo);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_pago` (IN `p_id_empleado` INT, IN `p_periodo` VARCHAR(50), IN `p_dias` INT, IN `p_metodo_pago` VARCHAR(50))  BEGIN
    DECLARE v_sueldo DECIMAL(10,2);
 
    SELECT sueldo_diario INTO v_sueldo
    FROM empleados
    WHERE id_empleado = p_id_empleado;
 
    INSERT INTO pagos_empleados (id_empleado, fecha_pago, periodo, dias_trabajados, sueldo_diario, total_pagado, metodo_pago)
    VALUES (p_id_empleado, CURDATE(), p_periodo, p_dias, v_sueldo, 0, p_metodo_pago);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_registrar_venta` (IN `p_metodo_pago` VARCHAR(50))  BEGIN
    INSERT INTO ventas (fecha_venta, total, metodo_pago)
    VALUES (CURDATE(), 0, p_metodo_pago);
 
    SELECT LAST_INSERT_ID() AS id_venta;
END$$

--
-- Funciones
--
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_calcular_pago` (`p_sueldo` DECIMAL(10,2), `p_dias` INT) RETURNS DECIMAL(10,2) BEGIN
    RETURN p_sueldo * p_dias;
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_costo_producto` (`p_id_producto` INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT IFNULL(SUM(pmp.cantidad_necesaria * mp.costo_unitario), 0)
            FROM producto_materia_prima pmp
            JOIN materia_prima mp ON mp.id_materia_prima = pmp.id_materia_prima
            WHERE pmp.id_producto = p_id_producto);
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_stock_materia` (`p_id_materia` INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT cantidad_disponible
            FROM materia_prima
            WHERE id_materia_prima = p_id_materia);
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_total_venta` (`p_id_venta` INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT IFNULL(SUM(subtotal), 0)
            FROM detalle_venta
            WHERE id_venta = p_id_venta);
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `fn_ventas_del_dia` (`p_fecha` DATE) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    RETURN (SELECT IFNULL(SUM(total), 0)
            FROM ventas
            WHERE fecha_venta = p_fecha);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_materia_prima`
--

CREATE TABLE `compras_materia_prima` (
  `id_compra` int(11) NOT NULL,
  `id_materia_prima` int(11) NOT NULL,
  `fecha_compra` date NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `costo_total` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `compras_materia_prima`
--

INSERT INTO `compras_materia_prima` (`id_compra`, `id_materia_prima`, `fecha_compra`, `cantidad`, `costo_total`) VALUES
(1, 1, '2026-10-02', '20.00', '560.00'),
(2, 2, '2026-10-03', '12.00', '384.00'),
(3, 3, '2026-10-04', '30.00', '135.00'),
(4, 4, '2026-10-05', '10.00', '260.00'),
(5, 5, '2026-10-06', '8.00', '880.00');

--
-- Disparadores `compras_materia_prima`
--
DELIMITER $$
CREATE TRIGGER `trg_compra_suma_stock` AFTER INSERT ON `compras_materia_prima` FOR EACH ROW BEGIN
    UPDATE materia_prima
    SET cantidad_disponible = cantidad_disponible + NEW.cantidad
    WHERE id_materia_prima = NEW.id_materia_prima;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `desperdicios`
--

CREATE TABLE `desperdicios` (
  `id_desperdicio` int(11) NOT NULL,
  `id_materia_prima` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `cantidad_desperdiciada` decimal(10,2) NOT NULL,
  `porcentaje_desperdicio` decimal(5,2) NOT NULL,
  `motivo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `desperdicios`
--

INSERT INTO `desperdicios` (`id_desperdicio`, `id_materia_prima`, `fecha`, `cantidad_desperdiciada`, `porcentaje_desperdicio`, `motivo`) VALUES
(1, 1, '2026-10-07', '1.50', '5.00', 'Harina dañada por humedad'),
(2, 4, '2026-10-08', '0.75', '5.00', 'Leche derramada durante la preparación');

--
-- Disparadores `desperdicios`
--
DELIMITER $$
CREATE TRIGGER `trg_desperdicio_resta_stock` AFTER INSERT ON `desperdicios` FOR EACH ROW BEGIN
    UPDATE materia_prima
    SET cantidad_disponible = cantidad_disponible - NEW.cantidad_desperdiciada
    WHERE id_materia_prima = NEW.id_materia_prima;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `detalles_venta_vista`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `detalles_venta_vista` (
`cantidad` int(11)
,`fecha_venta` date
,`id_venta` int(11)
,`nombre_producto` varchar(150)
,`precio_unitario` decimal(10,2)
,`subtotal` decimal(10,2)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_venta`
--

CREATE TABLE `detalle_venta` (
  `id_detalle` int(11) NOT NULL,
  `id_venta` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `detalle_venta`
--

INSERT INTO `detalle_venta` (`id_detalle`, `id_venta`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 1, 1, '320.00', '0.00'),
(2, 1, 3, 2, '95.00', '0.00'),
(3, 2, 2, 2, '280.00', '0.00'),
(4, 3, 3, 3, '95.00', '0.00'),
(5, 3, 1, 1, '320.00', '0.00'),
(6, 4, 2, 1, '280.00', '0.00');

--
-- Disparadores `detalle_venta`
--
DELIMITER $$
CREATE TRIGGER `trg_detalle_subtotal` BEFORE INSERT ON `detalle_venta` FOR EACH ROW BEGIN
    SET NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_detalle_total_venta` AFTER INSERT ON `detalle_venta` FOR EACH ROW BEGIN
    UPDATE ventas
    SET total = total + NEW.subtotal
    WHERE id_venta = NEW.id_venta;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `id_empleado` int(11) NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `experiencia_laboral` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sueldo_diario` decimal(10,2) NOT NULL,
  `fecha_ingreso` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`id_empleado`, `nombre`, `experiencia_laboral`, `sueldo_diario`, `fecha_ingreso`) VALUES
(1, 'Sergio Ramirez', '5 años como repartidor', '300.00', '2025-07-12'),
(2, 'Luis Martínez', '2 años de experiencia en atención al cliente', '260.00', '2026-01-20'),
(3, 'Sofía Hernández', '1 año de experiencia en producción', '280.00', '2026-03-05');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `inventario_bajo`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `inventario_bajo` (
`cantidad_disponible` decimal(10,2)
,`nombre` varchar(150)
,`unidad_medida` varchar(50)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `mas_vendidos`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `mas_vendidos` (
`nombre_producto` varchar(150)
,`unidades_vendidas` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materia_prima`
--

CREATE TABLE `materia_prima` (
  `id_materia_prima` int(11) NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unidad_medida` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad_disponible` decimal(10,2) NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `materia_prima`
--

INSERT INTO `materia_prima` (`id_materia_prima`, `nombre`, `unidad_medida`, `cantidad_disponible`, `costo_unitario`, `estado`) VALUES
(1, 'Pan', 'kg', '7.50', '28.00', 'Disponible'),
(2, 'Dedos de queso\r\n', 'kg', '7.00', '32.00', 'Disponible'),
(3, 'Cebolla', 'kg', '20.00', '4.50', 'Disponible'),
(4, 'lechuga', 'kg', '4.25', '26.00', 'Disponible'),
(5, 'Salsa ranch', 'litros', '14.40', '110.00', 'Disponible');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_empleados`
--

CREATE TABLE `pagos_empleados` (
  `id_pago` int(11) NOT NULL,
  `id_empleado` int(11) NOT NULL,
  `fecha_pago` date NOT NULL,
  `periodo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dias_trabajados` int(11) NOT NULL,
  `sueldo_diario` decimal(10,2) NOT NULL,
  `total_pagado` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pagos_empleados`
--

INSERT INTO `pagos_empleados` (`id_pago`, `id_empleado`, `fecha_pago`, `periodo`, `dias_trabajados`, `sueldo_diario`, `total_pagado`, `metodo_pago`) VALUES
(1, 1, '2026-10-13', 'Semana 1 de octubre', 6, '300.00', '1800.00', 'Transferencia'),
(2, 2, '2026-10-13', 'Semana 1 de octubre', 5, '260.00', '1300.00', 'Efectivo'),
(3, 3, '2026-10-13', 'Semana 1 de octubre', 6, '280.00', '1680.00', 'Transferencia');

--
-- Disparadores `pagos_empleados`
--
DELIMITER $$
CREATE TRIGGER `trg_pago_total` BEFORE INSERT ON `pagos_empleados` FOR EACH ROW BEGIN
    SET NEW.total_pagado = fn_calcular_pago(NEW.sueldo_diario, NEW.dias_trabajados);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `pagos_empleados_vista`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `pagos_empleados_vista` (
`dias_trabajados` int(11)
,`fecha_pago` date
,`nombre` varchar(150)
,`periodo` varchar(50)
,`total_pagado` decimal(10,2)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` int(11) NOT NULL,
  `nombre_producto` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `estado` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre_producto`, `descripcion`, `precio`, `estado`) VALUES
(1, 'Hamburguesa Midwest', 'Hamburguesa de res o de pollo, con salsa bbq, lechuga, cebolla acaramelizada y queso amarillo', '120.00', 'Activo'),
(2, 'Hamburguesa Bigdaddynels', 'Hamburguesa de res o de pollo, con aderezo de la casa, lechuga, tocino, cebolla y queso blanco', '180.00', 'Activo'),
(3, 'Dedos de queso', 'Dedos de quesos clasicos', '90.00', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_materia_prima`
--

CREATE TABLE `producto_materia_prima` (
  `id_producto` int(11) NOT NULL,
  `id_materia_prima` int(11) NOT NULL,
  `cantidad_necesaria` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `producto_materia_prima`
--

INSERT INTO `producto_materia_prima` (`id_producto`, `id_materia_prima`, `cantidad_necesaria`) VALUES
(1, 1, '0.50'),
(1, 5, '0.30'),
(2, 1, '0.50'),
(2, 4, '0.25'),
(3, 2, '0.20'),
(3, 3, '2.00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contraseña` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`nombre`, `usuario`, `contraseña`, `correo`) VALUES
('SuperAdmin', 'Admin', '12345678', 'curisistem2327@gmail.com');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

CREATE TABLE `ventas` (
  `id_venta` int(11) NOT NULL,
  `fecha_venta` date NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ventas`
--

INSERT INTO `ventas` (`id_venta`, `fecha_venta`, `total`, `metodo_pago`) VALUES
(1, '2026-10-08', '120.00', 'Efectivo'),
(2, '2026-10-09', '128.00', 'Transferencia'),
(3, '2026-10-10', '90.00', 'Tarjeta'),
(4, '2026-10-12', '240.00', 'Efectivo');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `venta_diaria`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `venta_diaria` (
`fecha_venta` date
,`num_ventas` bigint(21)
,`total_vendido` decimal(32,2)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `detalles_venta_vista`
--
DROP TABLE IF EXISTS `detalles_venta_vista`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `detalles_venta_vista`  AS  select `v`.`id_venta` AS `id_venta`,`v`.`fecha_venta` AS `fecha_venta`,`p`.`nombre_producto` AS `nombre_producto`,`dv`.`cantidad` AS `cantidad`,`dv`.`precio_unitario` AS `precio_unitario`,`dv`.`subtotal` AS `subtotal` from ((`ventas` `v` join `detalle_venta` `dv` on((`dv`.`id_venta` = `v`.`id_venta`))) join `productos` `p` on((`p`.`id_producto` = `dv`.`id_producto`))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `inventario_bajo`
--
DROP TABLE IF EXISTS `inventario_bajo`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `inventario_bajo`  AS  select `materia_prima`.`nombre` AS `nombre`,`materia_prima`.`unidad_medida` AS `unidad_medida`,`materia_prima`.`cantidad_disponible` AS `cantidad_disponible` from `materia_prima` where (`materia_prima`.`cantidad_disponible` <= 10) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `mas_vendidos`
--
DROP TABLE IF EXISTS `mas_vendidos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `mas_vendidos`  AS  select `p`.`nombre_producto` AS `nombre_producto`,sum(`dv`.`cantidad`) AS `unidades_vendidas` from (`detalle_venta` `dv` join `productos` `p` on((`p`.`id_producto` = `dv`.`id_producto`))) group by `p`.`nombre_producto` order by `unidades_vendidas` desc ;

-- --------------------------------------------------------

--
-- Estructura para la vista `pagos_empleados_vista`
--
DROP TABLE IF EXISTS `pagos_empleados_vista`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `pagos_empleados_vista`  AS  select `e`.`nombre` AS `nombre`,`pe`.`fecha_pago` AS `fecha_pago`,`pe`.`periodo` AS `periodo`,`pe`.`dias_trabajados` AS `dias_trabajados`,`pe`.`total_pagado` AS `total_pagado` from (`pagos_empleados` `pe` join `empleados` `e` on((`e`.`id_empleado` = `pe`.`id_empleado`))) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `venta_diaria`
--
DROP TABLE IF EXISTS `venta_diaria`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `venta_diaria`  AS  select `ventas`.`fecha_venta` AS `fecha_venta`,count(0) AS `num_ventas`,sum(`ventas`.`total`) AS `total_vendido` from `ventas` group by `ventas`.`fecha_venta` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `compras_materia_prima`
--
ALTER TABLE `compras_materia_prima`
  ADD PRIMARY KEY (`id_compra`),
  ADD KEY `fk_compras_materia_prima` (`id_materia_prima`);

--
-- Indices de la tabla `desperdicios`
--
ALTER TABLE `desperdicios`
  ADD PRIMARY KEY (`id_desperdicio`),
  ADD KEY `fk_desperdicios_materia_prima` (`id_materia_prima`);

--
-- Indices de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `fk_detalle_venta` (`id_venta`),
  ADD KEY `fk_detalle_producto` (`id_producto`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id_empleado`);

--
-- Indices de la tabla `materia_prima`
--
ALTER TABLE `materia_prima`
  ADD PRIMARY KEY (`id_materia_prima`);

--
-- Indices de la tabla `pagos_empleados`
--
ALTER TABLE `pagos_empleados`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `fk_pagos_empleado` (`id_empleado`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`);

--
-- Indices de la tabla `producto_materia_prima`
--
ALTER TABLE `producto_materia_prima`
  ADD PRIMARY KEY (`id_producto`,`id_materia_prima`),
  ADD KEY `fk_pmp_materia_prima` (`id_materia_prima`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD UNIQUE KEY `usuario` (`usuario`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD PRIMARY KEY (`id_venta`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `compras_materia_prima`
--
ALTER TABLE `compras_materia_prima`
  MODIFY `id_compra` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `desperdicios`
--
ALTER TABLE `desperdicios`
  MODIFY `id_desperdicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id_empleado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `materia_prima`
--
ALTER TABLE `materia_prima`
  MODIFY `id_materia_prima` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pagos_empleados`
--
ALTER TABLE `pagos_empleados`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_producto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `ventas`
--
ALTER TABLE `ventas`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `compras_materia_prima`
--
ALTER TABLE `compras_materia_prima`
  ADD CONSTRAINT `fk_compras_materia_prima` FOREIGN KEY (`id_materia_prima`) REFERENCES `materia_prima` (`id_materia_prima`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `desperdicios`
--
ALTER TABLE `desperdicios`
  ADD CONSTRAINT `fk_desperdicios_materia_prima` FOREIGN KEY (`id_materia_prima`) REFERENCES `materia_prima` (`id_materia_prima`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_venta`
--
ALTER TABLE `detalle_venta`
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`id_venta`) REFERENCES `ventas` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `pagos_empleados`
--
ALTER TABLE `pagos_empleados`
  ADD CONSTRAINT `fk_pagos_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto_materia_prima`
--
ALTER TABLE `producto_materia_prima`
  ADD CONSTRAINT `fk_pmp_materia_prima` FOREIGN KEY (`id_materia_prima`) REFERENCES `materia_prima` (`id_materia_prima`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pmp_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
