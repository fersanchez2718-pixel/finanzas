import React, { useState, useEffect } from 'react';
import { 
  Carrot, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  RefreshCw, 
  Boxes,
  X,
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:3000/api/materia-prima';

export default function CatalogoMateriaPrima() {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Estado del modal de formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    unidad_medida: 'Kg',
    cantidad_disponible: '',
    costo_unitario: '',
    estado: 'Disponible'
  });

  // Modal de confirmación de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState(null);

  // Notificación tipo toast
  const [toast, setToast] = useState(null);

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Cargar datos desde la API
  const cargarInsumos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.success) {
        setInsumos(data.data);
      } else {
        setError(data.message || 'Error al obtener datos');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor backend (puerto 3000). Verifica que esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      nombre: '',
      unidad_medida: 'Kg',
      cantidad_disponible: '',
      costo_unitario: '',
      estado: 'Disponible'
    });
    setModalOpen(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (item) => {
    setModoEdicion(true);
    setIdEditando(item.id_materia_prima);
    setFormData({
      nombre: item.nombre,
      unidad_medida: item.unidad_medida,
      cantidad_disponible: item.cantidad_disponible,
      costo_unitario: item.costo_unitario,
      estado: item.estado
    });
    setModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.unidad_medida || formData.cantidad_disponible === '' || formData.costo_unitario === '') {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_URL}/${idEditando}` : API_URL;
      const method = modoEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();

      if (resData.success) {
        showToast(
          modoEdicion ? '✓ Insumo culinario actualizado en MySQL' : '✓ Nuevo ingrediente guardado en MySQL',
          'success'
        );
        setModalOpen(false);
        cargarInsumos();
      } else {
        showToast(resData.message || 'Error al guardar', 'error');
      }
    } catch (err) {
      console.error('Error al guardar en backend:', err);
      showToast('Error de conexión con el servidor backend', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!itemAEliminar) return;
    try {
      const response = await fetch(`${API_URL}/${itemAEliminar.id_materia_prima}`, {
        method: 'DELETE'
      });
      const resData = await response.json();
      if (resData.success) {
        showToast('✓ Insumo eliminado del catálogo', 'success');
        setDeleteModalOpen(false);
        setItemAEliminar(null);
        cargarInsumos();
      } else {
        showToast(resData.message || 'No se pudo eliminar', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error al conectar con el servidor', 'error');
    }
  };

  // Filtrado en el cliente
  const insumosFiltrados = insumos.filter((item) => {
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  // Métricas / KPIs calculados
  const totalInsumos = insumos.length;
  const valorTotalAlmacen = insumos.reduce((acc, item) => {
    return acc + (Number(item.cantidad_disponible) * Number(item.costo_unitario));
  }, 0);
  const stockCriticoCount = insumos.filter(i => i.estado === 'Stock Bajo' || i.estado === 'Agotado').length;
  const disponiblesCount = insumos.filter(i => i.estado === 'Disponible').length;

  return (
    <div className="w-full flex flex-col gap-6 animation-fade-in pb-12">
      
      {/* Toast flotante */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white font-medium text-sm backdrop-blur-md border ${
            toast.tipo === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-rose-600/90 border-rose-400'
          }`}>
            {toast.tipo === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.mensaje}</span>
          </div>
        </div>
      )}

      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Carrot size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo de Materia Prima</h1>
              <p className="text-slate-400 text-sm">Control y administración de ingredientes culinarios y stock de cocina (MySQL: Finanzas_BD)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarInsumos}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700/60"
            title="Recargar desde base de datos"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-400' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nuevo Ingrediente</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Almacén / Cocina */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-orange-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Insumos Registrados</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{totalInsumos}</h3>
            <p className="text-xs text-slate-400 mt-1">Materias primas en catálogo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Boxes size={24} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Inversión en Almacén</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ${valorTotalAlmacen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-400 mt-1">Valor total de inventario</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Stock Disponible</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{disponiblesCount}</h3>
            <p className="text-xs text-indigo-400 mt-1">Ingredientes con stock óptimo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Insumos Críticos</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{stockCriticoCount}</h3>
            <p className="text-xs text-rose-300 mt-1">Stock bajo o agotados</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ingrediente (ej. Pollo, Queso)..."
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Selector de Estado / Semáforo */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter size={14} /> Estado:
          </span>
          {['Todos', 'Disponible', 'Stock Bajo', 'Agotado'].map((est) => {
            const activo = filtroEstado === est;
            return (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activo 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {est}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla Principal de Insumos */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm">Consultando base de datos MySQL...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-white font-semibold text-base">Error al conectar con la base de datos</h4>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
            <button
              type="button"
              onClick={cargarInsumos}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : insumosFiltrados.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Carrot size={40} className="text-slate-600 mb-2" />
            <h4 className="text-white font-semibold text-base">No se encontraron insumos</h4>
            <p className="text-sm text-slate-500">
              {busqueda || filtroEstado !== 'Todos'
                ? 'Prueba modificando los filtros o el término de búsqueda.'
                : 'Empieza registrando tu primer ingrediente con el botón "Nuevo Ingrediente".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4"># ID</th>
                  <th className="py-3.5 px-4">Ingrediente / Insumo</th>
                  <th className="py-3.5 px-4">Unidad</th>
                  <th className="py-3.5 px-4 text-right">Stock en Cocina</th>
                  <th className="py-3.5 px-4 text-right">Costo Unitario</th>
                  <th className="py-3.5 px-4 text-right">Valor en Inventario</th>
                  <th className="py-3.5 px-4 text-center">Semáforo de Stock</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
                {insumosFiltrados.map((item) => {
                  const stockNum = Number(item.cantidad_disponible);
                  const costoNum = Number(item.costo_unitario);
                  const subtotal = stockNum * costoNum;

                  return (
                    <tr 
                      key={item.id_materia_prima} 
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                        #{item.id_materia_prima}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-orange-400/80"></span>
                          <span>{item.nombre}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60">
                          {item.unidad_medida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        <span className={stockNum <= 0 ? 'text-rose-400' : stockNum <= 5 ? 'text-amber-400' : 'text-slate-200'}>
                          {stockNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {item.unidad_medida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        ${costoNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.estado === 'Disponible' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Disponible
                          </span>
                        )}
                        {item.estado === 'Stock Bajo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle size={12} />
                            Stock Bajo
                          </span>
                        )}
                        {item.estado === 'Agotado' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle size={12} />
                            Agotado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                            title="Editar insumo"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setItemAEliminar(item);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar insumo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulario: Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Carrot size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {modoEdicion ? 'Editar Insumo de Cocina' : 'Registrar Nuevo Ingrediente'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Ingrediente / Insumo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Pechuga de Pollo Fresca, Queso Cheddar..."
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Unidad de Medida */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Unidad de Medida *
                  </label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="Kg">Kg (Kilogramos)</option>
                    <option value="Litro">Litro (Líquidos)</option>
                    <option value="Pza">Pza (Piezas / Unidades)</option>
                    <option value="Gramos">Gramos (g)</option>
                    <option value="Docena">Docena (12 pzas)</option>
                    <option value="Paquete">Paquete / Caja</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estado Operativo
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="Disponible">Disponible (Óptimo)</option>
                    <option value="Stock Bajo">Stock Bajo (Próximo a agotar)</option>
                    <option value="Agotado">Agotado (Comprar ya)</option>
                  </select>
                </div>
              </div>

              {/* Cantidad y Costo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Stock Disponible *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.cantidad_disponible}
                    onChange={(e) => {
                      const cant = e.target.value;
                      let nuevoEstado = formData.estado;
                      const num = Number(cant);
                      if (num <= 0) nuevoEstado = 'Agotado';
                      else if (num <= 5) nuevoEstado = 'Stock Bajo';
                      else nuevoEstado = 'Disponible';

                      setFormData({ 
                        ...formData, 
                        cantidad_disponible: cant,
                        estado: nuevoEstado 
                      });
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Costo Unitario ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.costo_unitario}
                    onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Cálculo en vivo */}
              {formData.cantidad_disponible && formData.costo_unitario && (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
                  <span>Valor Total Estimado en Almacén:</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    ${(Number(formData.cantidad_disponible) * Number(formData.costo_unitario)).toFixed(2)} MXN
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Guardando en BD...</span>
                    </>
                  ) : (
                    <span>{modoEdicion ? 'Actualizar Insumo' : 'Guardar Ingrediente'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteModalOpen && itemAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¿Eliminar este insumo?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Estás a punto de eliminar <strong className="text-white">"{itemAEliminar.nombre}"</strong> de la base de datos MySQL. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setItemAEliminar(null);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
