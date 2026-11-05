import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Sliders, 
  Boxes, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw,
  X,
  AlertCircle
} from 'lucide-react';

const API_INVENTARIO = 'http://localhost:3000/api/inventario';

export default function GestionInventario() {
  const [inventario, setInventario] = useState([]);
  const [resumen, setResumen] = useState({
    totalInsumos: 0,
    valorTotal: 0,
    stockCritico: 0,
    totalUnidades: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modal de Ajuste
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [tipoAjuste, setTipoAjuste] = useState('fijar'); // 'fijar', 'sumar', 'restar'
  const [cantidadAjuste, setCantidadAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('Reconteo físico de turno');
  const [guardando, setGuardando] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const cargarInventario = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_INVENTARIO);
      const data = await res.json();
      if (data.success) {
        setInventario(data.data);
        setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al consultar inventario');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const abrirModalAjuste = (item) => {
    setItemSeleccionado(item);
    setTipoAjuste('fijar');
    setCantidadAjuste(item.cantidad_disponible);
    setMotivoAjuste('Reconteo físico de turno');
    setModalAjusteOpen(true);
  };

  const handleAjusteSubmit = async (e) => {
    e.preventDefault();
    if (!itemSeleccionado || cantidadAjuste === '') {
      showToast('Ingresa una cantidad válida', 'error');
      return;
    }

    const cantNum = parseFloat(cantidadAjuste);
    if (isNaN(cantNum) || cantNum < 0) {
      showToast('La cantidad debe ser un número mayor o igual a cero', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_INVENTARIO}/${itemSeleccionado.id_materia_prima}/ajuste`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_ajuste: tipoAjuste,
          cantidad: cantNum,
          motivo: motivoAjuste
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Stock actualizado correctamente');
        setModalAjusteOpen(false);
        cargarInventario();
      } else {
        showToast(resData.message || 'Error al ajustar stock', 'error');
      }
    } catch (err) {
      console.error('Error al ajustar:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado
  const itemsFiltrados = inventario.filter(item => {
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  // Cálculo en vivo para modal de ajuste
  const calcularStockProyectado = () => {
    if (!itemSeleccionado || cantidadAjuste === '') return null;
    const actual = parseFloat(itemSeleccionado.cantidad_disponible);
    const input = parseFloat(cantidadAjuste);
    if (isNaN(input)) return null;

    let resultado = actual;
    if (tipoAjuste === 'fijar') resultado = input;
    else if (tipoAjuste === 'sumar') resultado = actual + input;
    else if (tipoAjuste === 'restar') resultado = Math.max(0, actual - input);

    return resultado;
  };

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
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Inventario</h1>
            <p className="text-slate-400 text-sm">Monitoreo de existencias, niveles operativos y auditoría física de almacén</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cargarInventario}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700/60"
            title="Recargar inventario"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-400' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPIs Operativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Artículos en Inventario</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{resumen.totalInsumos}</h3>
            <p className="text-xs text-slate-400 mt-1">Materias primas auditadas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Boxes size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Valoración en Almacén</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ${Number(resumen.valorTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-400 mt-1">Existencias valorizadas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Volumen Total Físico</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {Number(resumen.totalUnidades).toLocaleString('es-MX', { maximumFractionDigits: 1 })}
            </h3>
            <p className="text-xs text-blue-400 mt-1">Unidades totales acumuladas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Insumos Críticos</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{resumen.stockCritico}</h3>
            <p className="text-xs text-rose-300 mt-1">Por agotarse o sin stock</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por insumo..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mr-1">
            <Filter size={14} /> Filtrar:
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

      {/* Tabla de Inventario y Niveles */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-indigo-400" />
            <p className="text-sm">Cargando niveles de inventario...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
              <AlertCircle size={32} />
            </div>
            <h4 className="text-white font-semibold text-base">Error al conectar con inventario</h4>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
            <button
              type="button"
              onClick={cargarInventario}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <Package size={40} className="text-slate-600 mb-2" />
            <h4 className="text-white font-semibold text-base">No se encontraron registros</h4>
            <p className="text-sm text-slate-500">Prueba con otros términos de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Insumo</th>
                  <th className="py-3.5 px-4">Unidad</th>
                  <th className="py-3.5 px-4 text-center w-48">Nivel de Stock</th>
                  <th className="py-3.5 px-4 text-right">Existencia Falsa/Real</th>
                  <th className="py-3.5 px-4 text-right">Valor Total ($)</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Auditoría / Ajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
                {itemsFiltrados.map((item) => {
                  const stockNum = parseFloat(item.cantidad_disponible);
                  const porcentaje = item.porcentaje_stock || 0;
                  const valor = parseFloat(item.valor_inventario || 0);

                  let colorBarra = 'bg-emerald-500';
                  if (stockNum <= 0) colorBarra = 'bg-rose-500';
                  else if (stockNum <= 5) colorBarra = 'bg-amber-500';

                  return (
                    <tr key={item.id_materia_prima} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.nombre}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60">
                          {item.unidad_medida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 w-full max-w-[160px] mx-auto">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>Capacidad</span>
                            <span className="font-mono">{porcentaje}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/50">
                            <div 
                              className={`h-full ${colorBarra} transition-all duration-500`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        <span className={stockNum <= 0 ? 'text-rose-400 font-bold' : stockNum <= 5 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                          {stockNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {item.unidad_medida}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                        ${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.estado === 'Disponible' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
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
                        <button
                          type="button"
                          onClick={() => abrirModalAjuste(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-medium border border-indigo-500/20 transition-all active:scale-[0.98]"
                        >
                          <Sliders size={13} />
                          <span>Ajustar</span>
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

      {/* Modal de Ajuste de Stock */}
      {modalAjusteOpen && itemSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Ajuste de Existencias</h3>
                  <p className="text-xs text-slate-400">{itemSeleccionado.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAjusteOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAjusteSubmit} className="space-y-4">
              {/* Información actual */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Stock Actual en Sistema:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {parseFloat(itemSeleccionado.cantidad_disponible).toFixed(2)} {itemSeleccionado.unidad_medida}
                </span>
              </div>

              {/* Selector de Modo de Ajuste */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoAjuste('fijar')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                      tipoAjuste === 'fijar'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <RotateCcw size={14} />
                    <span>Conteo Exacto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAjuste('sumar')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                      tipoAjuste === 'sumar'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight size={14} />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAjuste('restar')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                      tipoAjuste === 'restar'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                        : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight size={14} />
                    <span>Salida (-)</span>
                  </button>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {tipoAjuste === 'fijar' ? 'Nueva Existencia Real' : tipoAjuste === 'sumar' ? 'Cantidad a Sumar' : 'Cantidad a Restar'} ({itemSeleccionado.unidad_medida}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Motivo de la Auditoría / Ajuste
                </label>
                <select
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="Reconteo físico de turno">Reconteo físico de turno</option>
                  <option value="Merma o desperdicio de cocina">Merma o desperdicio de cocina</option>
                  <option value="Consumo operativo interno">Consumo operativo interno</option>
                  <option value="Corrección de captura">Corrección de captura previa</option>
                  <option value="Devolución o reposición">Devolución o reposición</option>
                </select>
              </div>

              {/* Resultado Proyectado */}
              {calcularStockProyectado() !== null && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex justify-between items-center text-slate-300">
                  <span>Stock resultante tras el ajuste:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {calcularStockProyectado().toFixed(2)} {itemSeleccionado.unidad_medida}
                  </span>
                </div>
              )}

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalAjusteOpen(false)}
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
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <span>Confirmar Ajuste</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
