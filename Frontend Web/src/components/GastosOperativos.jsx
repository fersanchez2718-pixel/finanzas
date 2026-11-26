import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Zap,
  Wrench,
  Sparkles,
  Package,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

const API_GASTOS = `${API_BASE}/gastos-operativos`;

export default function GastosOperativos() {
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState({
    totalGastos: 0,
    cantidadRegistros: 0,
    promedioGasto: 0,
    desgloseCategorias: {}
  });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    concepto: '',
    categoria: 'Servicios',
    monto: '',
    fecha_gasto: hoy,
    metodo_pago: 'Transferencia',
    comprobante_referencia: '',
    notas: ''
  });

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarGastos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroFechaInicio) params.append('fecha_inicio', filtroFechaInicio);
      if (filtroFechaFin) params.append('fecha_fin', filtroFechaFin);
      if (filtroCategoria !== 'Todas') params.append('categoria', filtroCategoria);

      const res = await fetch(`${API_GASTOS}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setGastos(data.data || []);
        setResumen(data.resumen || {
          totalGastos: 0,
          cantidadRegistros: 0,
          promedioGasto: 0,
          desgloseCategorias: {}
        });
      } else {
        showToast(data.message || 'Error al obtener gastos', 'error');
      }
    } catch (err) {
      console.error('Error al cargar gastos operativos:', err);
      showToast('No se pudo conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGastos();
  }, [filtroCategoria, filtroFechaInicio, filtroFechaFin]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      concepto: '',
      categoria: 'Servicios',
      monto: '',
      fecha_gasto: hoy,
      metodo_pago: 'Transferencia',
      comprobante_referencia: '',
      notas: ''
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (gasto) => {
    setModoEdicion(true);
    setIdEditando(gasto.id_gasto);
    setFormData({
      concepto: gasto.concepto,
      categoria: gasto.categoria,
      monto: gasto.monto,
      fecha_gasto: gasto.fecha_gasto,
      metodo_pago: gasto.metodo_pago,
      comprobante_referencia: gasto.comprobante_referencia || '',
      notas: gasto.notas || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.concepto.trim()) {
      showToast('Ingresa el concepto del gasto', 'error');
      return;
    }
    const montoVal = parseFloat(formData.monto);
    if (isNaN(montoVal) || montoVal <= 0) {
      showToast('Ingresa un monto válido mayor a 0', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_GASTOS}/${idEditando}` : API_GASTOS;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Gasto guardado con éxito');
        setModalOpen(false);
        cargarGastos();
      } else {
        showToast(data.message || 'Error al guardar gasto', 'error');
      }
    } catch (err) {
      console.error('Error al guardar gasto:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!gastoAEliminar) return;
    try {
      const res = await fetch(`${API_GASTOS}/${gastoAEliminar.id_gasto}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Gasto operativo anulado correctamente');
        setDeleteModalOpen(false);
        setGastoAEliminar(null);
        cargarGastos();
      } else {
        showToast(data.message || 'Error al anular gasto', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      showToast('Error de conexión al servidor', 'error');
    }
  };

  // Filtrado en memoria por texto de búsqueda
  const gastosFiltrados = gastos.filter(g => {
    const texto = busqueda.toLowerCase();
    const coincideConcepto = g.concepto.toLowerCase().includes(texto);
    const coincideCategoria = g.categoria.toLowerCase().includes(texto);
    const coincideMetodo = g.metodo_pago.toLowerCase().includes(texto);
    const coincideRef = g.comprobante_referencia ? g.comprobante_referencia.toLowerCase().includes(texto) : false;
    return coincideConcepto || coincideCategoria || coincideMetodo || coincideRef;
  });

  // Identificar categoría con mayor consumo
  let categoriaTop = 'Ninguna';
  let montoTop = 0;
  if (resumen.desgloseCategorias) {
    Object.entries(resumen.desgloseCategorias).forEach(([cat, val]) => {
      if (val.monto > montoTop) {
        montoTop = val.monto;
        categoriaTop = cat;
      }
    });
  }

  const getBadgeCategoria = (cat) => {
    switch (cat) {
      case 'Renta':
        return {
          icon: <Building size={13} />,
          classes: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'Servicios':
        return {
          icon: <Zap size={13} />,
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'Mantenimiento':
        return {
          icon: <Wrench size={13} />,
          classes: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        };
      case 'Insumos Limpieza':
        return {
          icon: <Sparkles size={13} />,
          classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
        };
      case 'Empaques':
        return {
          icon: <Package size={13} />,
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      default:
        return {
          icon: <Layers size={13} />,
          classes: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        };
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Receipt className="text-rose-400" size={32} />
            Gastos Operativos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Control de egresos del local: servicios, renta, mantenimiento, empaques e insumos de limpieza
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={cargarGastos}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gastos Operativos</p>
          <h3 className="text-2xl font-black font-mono text-rose-400 mt-2">
            ${Number(resumen.totalGastos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Egresos registrados en el período</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comprobantes Registrados</p>
          <h3 className="text-2xl font-black text-white mt-2">
            {resumen.cantidadRegistros}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Facturas, recibos y tickets</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gasto Promedio por Registro</p>
          <h3 className="text-2xl font-black font-mono text-indigo-400 mt-2">
            ${Number(resumen.promedioGasto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Costo medio por erogación</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mayor Erogación</p>
          <h3 className="text-xl font-black text-amber-300 mt-2 truncate">
            {categoriaTop}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ${Number(montoTop).toLocaleString('es-MX', { minimumFractionDigits: 2 })} acumulados
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Búsqueda por texto */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por concepto, comprobante o notas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Filtros selectores */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categoría */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter size={14} className="text-rose-400" />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="Todas" className="bg-slate-900">Todas las categorías</option>
              <option value="Servicios" className="bg-slate-900">Servicios</option>
              <option value="Renta" className="bg-slate-900">Renta</option>
              <option value="Mantenimiento" className="bg-slate-900">Mantenimiento</option>
              <option value="Insumos Limpieza" className="bg-slate-900">Insumos Limpieza</option>
              <option value="Empaques" className="bg-slate-900">Empaques</option>
              <option value="Otros" className="bg-slate-900">Otros</option>
            </select>
          </div>

          {/* Rango de fechas */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Calendar size={13} className="text-indigo-400" />
            <input
              type="date"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              className="bg-transparent text-white outline-none text-xs [color-scheme:dark]"
              title="Fecha inicial"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={filtroFechaFin}
              onChange={(e) => setFiltroFechaFin(e.target.value)}
              className="bg-transparent text-white outline-none text-xs [color-scheme:dark]"
              title="Fecha final"
            />
          </div>

          {(filtroFechaInicio || filtroFechaFin || filtroCategoria !== 'Todas') && (
            <button
              type="button"
              onClick={() => {
                setFiltroFechaInicio('');
                setFiltroFechaFin('');
                setFiltroCategoria('Todas');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Gastos Operativos (Cero IDs visibles) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-rose-400" />
            <p className="text-sm">Consultando gastos operativos...</p>
          </div>
        ) : gastosFiltrados.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FileSpreadsheet size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No se encontraron gastos operativos</p>
            <p className="text-xs text-slate-500 mt-1">Registra los gastos del local o modifica tus filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Fecha</th>
                  <th className="py-3.5 px-4 font-semibold">Concepto / Descripción</th>
                  <th className="py-3.5 px-4 font-semibold">Categoría</th>
                  <th className="py-3.5 px-4 font-semibold">Forma de Pago</th>
                  <th className="py-3.5 px-4 font-semibold">Comprobante / Ref</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Monto ($)</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {gastosFiltrados.map((g) => {
                  const badge = getBadgeCategoria(g.categoria);
                  return (
                    <tr key={g.id_gasto} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {g.fecha_gasto}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{g.concepto}</div>
                        {g.notas && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{g.notas}</div>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.classes}`}>
                          {badge.icon}
                          <span>{g.categoria}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300">
                        {g.metodo_pago}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {g.comprobante_referencia || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                        ${parseFloat(g.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(g)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Editar gasto"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGastoAEliminar(g);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Anular gasto"
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

      {/* Modal Registrar / Editar Gasto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 md:p-8 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modoEdicion ? 'Modificar Gasto Operativo' : 'Registrar Nuevo Gasto'}
                  </h3>
                  <p className="text-xs text-slate-400">Captura de egresos de mantenimiento y operación</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Concepto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Concepto del Gasto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Suministro de Gas LP 45kg, Renta del local..."
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 outline-none transition-colors"
                />
              </div>

              {/* Categoría y Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 outline-none transition-colors"
                  >
                    <option value="Servicios">Servicios (Luz, Agua, Gas, Internet)</option>
                    <option value="Renta">Renta del Local</option>
                    <option value="Mantenimiento">Mantenimiento y Reparación</option>
                    <option value="Insumos Limpieza">Insumos de Limpieza</option>
                    <option value="Empaques">Empaques y Desechables</option>
                    <option value="Otros">Otros Egresos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Monto Total ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-rose-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Fecha y Método de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de Pago *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_gasto}
                    onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Forma de Pago *
                  </label>
                  <select
                    value={formData.metodo_pago}
                    onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 outline-none transition-colors"
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  </select>
                </div>
              </div>

              {/* Comprobante / Factura / Ticket */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Número de Comprobante / Factura / Ticket (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. FAC-4920, FOLIO-0192..."
                  value={formData.comprobante_referencia}
                  onChange={(e) => setFormData({ ...formData, comprobante_referencia: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 outline-none transition-colors"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notas u Observaciones
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre el proveedor o especificaciones del servicio..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-rose-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Acciones */}
              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{modoEdicion ? 'Actualizar Gasto' : 'Guardar Gasto'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Anulación */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle size={28} />
              <h3 className="text-lg font-bold text-white">¿Anular este gasto operativo?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Estás a punto de anular el gasto correspondiente a{' '}
              <strong className="text-white">"{gastoAEliminar?.concepto}"</strong> por un monto de{' '}
              <strong className="text-rose-400 font-mono">${parseFloat(gastoAEliminar?.monto || 0).toFixed(2)}</strong>.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Esta acción deducirá este egreso de los balances consolidados del negocio.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setGastoAEliminar(null);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Sí, Anular Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
