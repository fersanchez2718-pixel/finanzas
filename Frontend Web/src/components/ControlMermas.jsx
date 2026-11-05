import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Plus, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  X, 
  AlertCircle, 
  PieChart,
  Layers
} from 'lucide-react';

const API_MERMAS = 'http://localhost:3000/api/mermas';
const API_MATERIA_PRIMA = 'http://localhost:3000/api/materia-prima';

export default function ControlMermas() {
  const [mermas, setMermas] = useState([]);
  const [resumen, setResumen] = useState({
    totalIncidentes: 0,
    perdidaTotal: 0,
    insumoMasMermado: 'Ninguno'
  });
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');

  // Modal Registrar Merma
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    id_materia_prima: '',
    fecha: hoy,
    cantidad_desperdiciada: '',
    motivo: 'Merma de preparación o corte'
  });

  // Modal Cancelar Merma
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mermaAEliminar, setMermaAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const cargarMermas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_MERMAS);
      const data = await res.json();
      if (data.success) {
        setMermas(data.data);
        setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al obtener mermas');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumos = async () => {
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
      console.error('Error al cargar catálogo de insumos:', err);
    }
  };

  useEffect(() => {
    cargarMermas();
    cargarInsumos();
  }, []);

  const abrirModalCrear = () => {
    setFormData({
      id_materia_prima: insumosDisponibles.length > 0 ? insumosDisponibles[0].id_materia_prima : '',
      fecha: hoy,
      cantidad_desperdiciada: '',
      motivo: 'Merma de preparación o corte'
    });
    setModalOpen(true);
  };

  const insumoSeleccionado = insumosDisponibles.find(
    i => String(i.id_materia_prima) === String(formData.id_materia_prima)
  );

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_materia_prima || !formData.fecha || formData.cantidad_desperdiciada === '') {
      showToast('Por favor completa los campos requeridos', 'error');
      return;
    }

    const cantNum = parseFloat(formData.cantidad_desperdiciada);
    if (isNaN(cantNum) || cantNum <= 0) {
      showToast('Ingresa una cantidad mayor a cero', 'error');
      return;
    }

    if (insumoSeleccionado && cantNum > parseFloat(insumoSeleccionado.cantidad_disponible)) {
      showToast(`La merma no puede superar el stock actual (${insumoSeleccionado.cantidad_disponible} ${insumoSeleccionado.unidad_medida})`, 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(API_MERMAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_materia_prima: formData.id_materia_prima,
          fecha: formData.fecha,
          cantidad_desperdiciada: cantNum,
          motivo: formData.motivo
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Merma registrada y stock actualizado');
        setModalOpen(false);
        cargarMermas();
        cargarInsumos();
      } else {
        showToast(resData.message || 'Error al registrar merma', 'error');
      }
    } catch (err) {
      console.error('Error al registrar merma:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!mermaAEliminar) return;
    try {
      const res = await fetch(`${API_MERMAS}/${mermaAEliminar.id_desperdicio}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('Merma cancelada y stock reintegrado al inventario');
        setDeleteModalOpen(false);
        setMermaAEliminar(null);
        cargarMermas();
        cargarInsumos();
      } else {
        showToast(resData.message || 'Error al cancelar merma', 'error');
      }
    } catch (err) {
      console.error('Error al anular merma:', err);
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  // Filtrado
  const mermasFiltradas = mermas.filter(item => {
    return item.nombre_materia_prima.toLowerCase().includes(busqueda.toLowerCase()) ||
           item.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
           item.fecha.includes(busqueda);
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
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Trash2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Control de Mermas</h1>
            <p className="text-slate-400 text-sm">Registro de desperdicios, cálculo de pérdidas monetarias y ajuste de inventario</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarMermas}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700/60"
            title="Recargar mermas"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-400' : ''} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Registrar Merma</span>
          </button>
        </div>
      </div>

      {/* KPIs de Mermas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pérdida Total en Mermas</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">
              ${Number(resumen.perdidaTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-300 mt-1">Impacto económico acumulado</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Insumo Más Desperdiciado</p>
            <h3 className="text-lg font-bold text-white mt-2 truncate max-w-[200px]" title={resumen.insumoMasMermado}>
              {resumen.insumoMasMermado}
            </h3>
            <p className="text-xs text-amber-400 mt-1">Mayor volumen mermado</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Incidentes Registrados</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{resumen.totalIncidentes}</h3>
            <p className="text-xs text-slate-400 mt-1">Eventos de desperdicio</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Layers size={24} />
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
            placeholder="Buscar por insumo, causa o fecha..."
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

      {/* Tabla de Mermas (SIN IDs) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm">Cargando mermas...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-white font-semibold text-base">Error al cargar mermas</h4>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
            <button
              type="button"
              onClick={cargarMermas}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : mermasFiltradas.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Trash2 size={40} className="text-slate-600 mb-2" />
            <h4 className="text-white font-semibold text-base">No hay mermas registradas</h4>
            <p className="text-sm text-slate-500">
              Registra incidentes con el botón "+ Registrar Merma" para mantener el inventario exacto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Insumo Afectado</th>
                  <th className="py-3.5 px-4 text-right">Cantidad Desperdiciada</th>
                  <th className="py-3.5 px-4 text-center">Tasa de Merma</th>
                  <th className="py-3.5 px-4 text-right">Pérdida Económica ($)</th>
                  <th className="py-3.5 px-4">Causa / Motivo</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
                {mermasFiltradas.map((item, idx) => {
                  const cantNum = parseFloat(item.cantidad_desperdiciada);
                  const costoPerdida = parseFloat(item.costo_perdida || 0);

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                        {item.fecha}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                          <span>{item.nombre_materia_prima}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium text-rose-300">
                        -{cantNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {item.unidad_medida}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <PieChart size={12} />
                          {parseFloat(item.porcentaje_desperdicio).toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                        ${costoPerdida.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {item.motivo}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setMermaAEliminar(item);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Anular merma y reintegrar stock"
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

      {/* Modal Registrar Merma */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Registrar Merma o Pérdida</h3>
                  <p className="text-xs text-slate-400">Descuenta automáticamente del inventario</p>
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
              {/* Insumo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Insumo Afectado *
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
                    Fecha del Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Cantidad Mermada {insumoSeleccionado ? `(${insumoSeleccionado.unidad_medida})` : ''} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.cantidad_desperdiciada}
                    onChange={(e) => setFormData({ ...formData, cantidad_desperdiciada: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Causa / Motivo del Desperdicio *
                </label>
                <select
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="Merma de preparación o corte">Merma de preparación o corte</option>
                  <option value="Caducidad de insumo">Caducidad de insumo</option>
                  <option value="Accidente o caída en cocina">Accidente o caída en cocina</option>
                  <option value="Falla en refrigeración">Falla en refrigeración</option>
                  <option value="Devolución por mala calidad">Devolución por mala calidad</option>
                </select>
              </div>

              {/* Impacto económico en vivo */}
              {insumoSeleccionado && formData.cantidad_desperdiciada && Number(formData.cantidad_desperdiciada) > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Pérdida Económica Estimada:</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      ${(Number(formData.cantidad_desperdiciada) * parseFloat(insumoSeleccionado.costo_unitario)).toFixed(2)} MXN
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Stock resultante tras merma:</span>
                    <span className="font-mono text-white">
                      {Math.max(0, parseFloat(insumoSeleccionado.cantidad_disponible) - Number(formData.cantidad_desperdiciada)).toFixed(2)} {insumoSeleccionado.unidad_medida}
                    </span>
                  </div>
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
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Registrar Merma</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Cancelación */}
      {deleteModalOpen && mermaAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">¿Anular este registro de merma?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Estás a punto de anular el desperdicio de <strong className="text-white">{mermaAEliminar.nombre_materia_prima}</strong> del {mermaAEliminar.fecha}.
              <br /><br />
              <span className="text-emerald-400 font-medium">Se reintegrarán {mermaAEliminar.cantidad_desperdiciada} {mermaAEliminar.unidad_medida} al inventario disponible.</span>
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setMermaAEliminar(null);
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
                Sí, Reintegrar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
