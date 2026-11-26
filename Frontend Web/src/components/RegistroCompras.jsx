import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  AlertCircle,
  Receipt,
  TrendingUp
} from 'lucide-react';

const API_COMPRAS = `${API_BASE}/compras`;
const API_MATERIA_PRIMA = `${API_BASE}/materia-prima`;

export default function RegistroCompras() {
  const [compras, setCompras] = useState([]);
  const [resumen, setResumen] = useState({
    totalCompras: 0,
    gastoTotal: 0,
    compraPromedio: 0,
    ultimaCompra: null
  });
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');

  // Modal Nueva Compra
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    id_materia_prima: '',
    fecha_compra: hoy,
    cantidad: '',
    costo_total: ''
  });

  // Modal Eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [compraAEliminar, setCompraAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Cargar lista de compras
  const cargarCompras = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_COMPRAS);
      const data = await res.json();
      if (data.success) {
        setCompras(data.data);
        setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al obtener compras');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar catálogo de insumos para el selector de compras
  const cargarInsumosParaCompras = async () => {
    try {
      const res = await fetch(API_MATERIA_PRIMA);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setInsumosDisponibles(data.data);
        if (!formData.id_materia_prima) {
          setFormData(prev => ({ ...prev, id_materia_prima: data.data[0].id_materia_prima }));
        }
      }
    } catch (err) {
      console.error('Error al cargar insumos para compras:', err);
    }
  };

  useEffect(() => {
    cargarCompras();
    cargarInsumosParaCompras();
  }, []);

  const abrirModalCrear = () => {
    setFormData({
      id_materia_prima: insumosDisponibles.length > 0 ? insumosDisponibles[0].id_materia_prima : '',
      fecha_compra: hoy,
      cantidad: '',
      costo_total: ''
    });
    setModalOpen(true);
  };

  // Insumo actualmente seleccionado en el modal
  const insumoSeleccionado = insumosDisponibles.find(
    i => String(i.id_materia_prima) === String(formData.id_materia_prima)
  );

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_materia_prima || !formData.fecha_compra || formData.cantidad === '' || formData.costo_total === '') {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const cantNum = parseFloat(formData.cantidad);
    const costoNum = parseFloat(formData.costo_total);

    if (isNaN(cantNum) || cantNum <= 0 || isNaN(costoNum) || costoNum < 0) {
      showToast('La cantidad debe ser mayor a cero y el costo total válido', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(API_COMPRAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_materia_prima: formData.id_materia_prima,
          fecha_compra: formData.fecha_compra,
          cantidad: cantNum,
          costo_total: costoNum
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Compra registrada y stock actualizado');
        setModalOpen(false);
        cargarCompras();
        cargarInsumosParaCompras(); // actualiza stock en catálogo
      } else {
        showToast(resData.message || 'Error al registrar compra', 'error');
      }
    } catch (err) {
      console.error('Error al crear compra:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Confirmar anulación de compra
  const confirmarEliminar = async () => {
    if (!compraAEliminar) return;
    try {
      const res = await fetch(`${API_COMPRAS}/${compraAEliminar.id_compra}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('Compra cancelada y stock revertido en inventario');
        setDeleteModalOpen(false);
        setCompraAEliminar(null);
        cargarCompras();
        cargarInsumosParaCompras();
      } else {
        showToast(resData.message || 'Error al eliminar', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar compra:', err);
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  // Filtrado
  const comprasFiltradas = compras.filter(item => {
    return item.nombre_materia_prima.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="w-full flex flex-col gap-6 animation-fade-in pb-12">
      {/* Toast */}
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

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Registro de Compras</h1>
            <p className="text-slate-400 text-sm">Adquisición de insumos de cocina y abastecimiento automático de stock</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarCompras}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700/60"
            title="Recargar compras"
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
            <span>Nueva Compra</span>
          </button>
        </div>
      </div>

      {/* KPIs de Compras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Inversión Total en Compras</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ${Number(resumen.gastoTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-400 mt-1">Gasto acumulado</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Órdenes Realizadas</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{resumen.totalCompras}</h3>
            <p className="text-xs text-slate-400 mt-1">Registros de adquisición</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Receipt size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Compra Promedio</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ${Number(resumen.compraPromedio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-blue-400 mt-1">Ticket medio por orden</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-orange-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Última Adquisición</p>
            <h3 className="text-lg font-bold text-white mt-2">
              {resumen.ultimaCompra ? resumen.ultimaCompra : 'Sin registros'}
            </h3>
            <p className="text-xs text-orange-400 mt-1">Fecha más reciente</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por insumo comprado..."
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
      </div>

      {/* Tabla de Historial de Compras */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm">Cargando historial de compras...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-white font-semibold text-base">Error al cargar compras</h4>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
            <button
              type="button"
              onClick={cargarCompras}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <ShoppingCart size={40} className="text-slate-600 mb-2" />
            <h4 className="text-white font-semibold text-base">No hay compras registradas</h4>
            <p className="text-sm text-slate-500">
              Registra compras con el botón "+ Nueva Compra" para abastecer automáticamente el inventario.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Insumo Adquirido</th>
                  <th className="py-3.5 px-4 text-right">Cantidad Comprada</th>
                  <th className="py-3.5 px-4 text-right">Costo Unitario Resultante</th>
                  <th className="py-3.5 px-4 text-right">Costo Total ($)</th>
                  <th className="py-3.5 px-4 text-center">Stock Actual en Cocina</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
                {comprasFiltradas.map((item) => {
                  const cantNum = parseFloat(item.cantidad);
                  const costoNum = parseFloat(item.costo_total);
                  const unitarioNum = parseFloat(item.costo_unitario_compra || (costoNum / cantNum));

                  return (
                    <tr key={item.id_compra} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {item.fecha_compra}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                          <span>{item.nombre_materia_prima}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                        +{cantNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {item.unidad_medida}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-xs">
                        ${unitarioNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {item.unidad_medida}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        ${costoNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/60">
                          <Package size={12} className="text-slate-400" />
                          {parseFloat(item.stock_actual_insumo).toFixed(2)} {item.unidad_medida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCompraAEliminar(item);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Anular compra y revertir stock"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Compra */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Registrar Compra de Insumo</h3>
                  <p className="text-xs text-slate-400">Ingreso de materia prima a almacén</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} className="space-y-4">
              {/* Selector de Insumo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Materia Prima / Insumo *
                </label>
                <select
                  value={formData.id_materia_prima}
                  onChange={(e) => setFormData({ ...formData, id_materia_prima: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  {insumosDisponibles.map(item => (
                    <option key={item.id_materia_prima} value={item.id_materia_prima}>
                      {item.nombre} (Stock actual: {parseFloat(item.cantidad_disponible).toFixed(2)} {item.unidad_medida})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Cantidad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_compra}
                    onChange={(e) => setFormData({ ...formData, fecha_compra: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cantidad Adquirida {insumoSeleccionado ? `(${insumoSeleccionado.unidad_medida})` : ''} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Costo Total */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Costo Total Pagado ($ MXN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.costo_total}
                  onChange={(e) => setFormData({ ...formData, costo_total: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Cálculo en vivo de costo unitario */}
              {formData.cantidad && formData.costo_total && Number(formData.cantidad) > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 flex justify-between items-center">
                  <span>Costo Unitario Resultante:</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    ${(Number(formData.costo_total) / Number(formData.cantidad)).toFixed(2)} MXN / {insumoSeleccionado?.unidad_medida}
                  </span>
                </div>
              )}

              {/* Nota de impacto automático en stock */}
              {insumoSeleccionado && formData.cantidad && Number(formData.cantidad) > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                  <span>
                    El stock de <strong>{insumoSeleccionado.nombre}</strong> aumentará de {parseFloat(insumoSeleccionado.cantidad_disponible).toFixed(2)} a <strong>{(parseFloat(insumoSeleccionado.cantidad_disponible) + Number(formData.cantidad)).toFixed(2)} {insumoSeleccionado.unidad_medida}</strong>.
                  </span>
                </div>
              )}

              {/* Botones */}
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
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Registrar Compra</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteModalOpen && compraAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¿Anular esta compra?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Estás a punto de anular la compra de <strong className="text-white">{compraAEliminar.nombre_materia_prima}</strong> del {compraAEliminar.fecha_compra}. 
              <br /><br />
              <span className="text-rose-400 font-medium">Se descontarán {compraAEliminar.cantidad} {compraAEliminar.unidad_medida} del inventario actual.</span>
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCompraAEliminar(null);
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
                Sí, Anular Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

