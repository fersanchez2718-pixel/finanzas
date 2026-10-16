const pool = require('../config/db');

// Obtener todas las materias primas
const getAll = async (req, res) => {
  try {
    const { busqueda, estado } = req.query;
    let query = 'SELECT * FROM MATERIA_PRIMA WHERE 1=1';
    const params = [];

    if (busqueda) {
      query += ' AND nombre LIKE ?';
      params.push(`%${busqueda}%`);
    }

    if (estado && estado !== 'Todos') {
      query += ' AND estado = ?';
      params.push(estado);
    }

    query += ' ORDER BY id_materia_prima DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al obtener materias primas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor al consultar insumos' });
  }
};

// Obtener una materia prima por ID
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM MATERIA_PRIMA WHERE id_materia_prima = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Insumo no encontrado' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error al obtener materia prima:', error);
    res.status(500).json({ success: false, message: 'Error al consultar el insumo' });
  }
};

// Determinar estado automáticamente si no se especifica o validar
const calcularEstado = (cantidad, estadoPropuesto) => {
  const cant = Number(cantidad);
  if (cant <= 0) return 'Agotado';
  if (cant <= 5) return 'Stock Bajo';
  return estadoPropuesto || 'Disponible';
};

// Crear nueva materia prima
const create = async (req, res) => {
  try {
    const { nombre, unidad_medida, cantidad_disponible, costo_unitario, estado } = req.body;

    if (!nombre || !unidad_medida || cantidad_disponible === undefined || costo_unitario === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos obligatorios deben estar presentes (nombre, unidad_medida, cantidad_disponible, costo_unitario)' 
      });
    }

    const cantidadNum = parseFloat(cantidad_disponible);
    const costoNum = parseFloat(costo_unitario);

    if (isNaN(cantidadNum) || cantidadNum < 0 || isNaN(costoNum) || costoNum < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'La cantidad y el costo deben ser números válidos y mayores o iguales a cero' 
      });
    }

    const estadoFinal = calcularEstado(cantidadNum, estado);

    const [result] = await pool.query(
      'INSERT INTO MATERIA_PRIMA (nombre, unidad_medida, cantidad_disponible, costo_unitario, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), unidad_medida.trim(), cantidadNum, costoNum, estadoFinal]
    );

    const nuevoInsumo = {
      id_materia_prima: result.insertId,
      nombre: nombre.trim(),
      unidad_medida: unidad_medida.trim(),
      cantidad_disponible: cantidadNum,
      costo_unitario: costoNum,
      estado: estadoFinal
    };

    res.status(201).json({ success: true, message: 'Insumo registrado exitosamente', data: nuevoInsumo });
  } catch (error) {
    console.error('Error al crear materia prima:', error);
    res.status(500).json({ success: false, message: 'Error al registrar el insumo en la base de datos' });
  }
};

// Actualizar materia prima existente
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, unidad_medida, cantidad_disponible, costo_unitario, estado } = req.body;

    const [existente] = await pool.query('SELECT * FROM MATERIA_PRIMA WHERE id_materia_prima = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Insumo no encontrado' });
    }

    const cantidadNum = cantidad_disponible !== undefined ? parseFloat(cantidad_disponible) : existente[0].cantidad_disponible;
    const costoNum = costo_unitario !== undefined ? parseFloat(costo_unitario) : existente[0].costo_unitario;
    const nombreFinal = nombre ? nombre.trim() : existente[0].nombre;
    const unidadFinal = unidad_medida ? unidad_medida.trim() : existente[0].unidad_medida;
    const estadoFinal = calcularEstado(cantidadNum, estado || existente[0].estado);

    await pool.query(
      'UPDATE MATERIA_PRIMA SET nombre = ?, unidad_medida = ?, cantidad_disponible = ?, costo_unitario = ?, estado = ? WHERE id_materia_prima = ?',
      [nombreFinal, unidadFinal, cantidadNum, costoNum, estadoFinal, id]
    );

    res.json({
      success: true,
      message: 'Insumo actualizado exitosamente',
      data: {
        id_materia_prima: Number(id),
        nombre: nombreFinal,
        unidad_medida: unidadFinal,
        cantidad_disponible: cantidadNum,
        costo_unitario: costoNum,
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al actualizar materia prima:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el insumo' });
  }
};

// Eliminar materia prima
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [existente] = await pool.query('SELECT * FROM MATERIA_PRIMA WHERE id_materia_prima = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ success: false, message: 'Insumo no encontrado' });
    }

    await pool.query('DELETE FROM MATERIA_PRIMA WHERE id_materia_prima = ?', [id]);

    res.json({ success: true, message: 'Insumo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar materia prima:', error);
    // En caso de llave foránea en otras tablas (ej. COMPRAS o DESPERDICIOS)
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el insumo porque ya tiene compras o recetas asociadas. Se recomienda cambiar su estado a Inactivo/Agotado.' 
      });
    }
    res.status(500).json({ success: false, message: 'Error al eliminar el insumo' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
