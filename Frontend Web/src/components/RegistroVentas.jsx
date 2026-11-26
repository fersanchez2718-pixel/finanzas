import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import {
  BadgeDollarSign,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  DollarSign,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  X,
  AlertCircle,
  Printer,
  FileText,
  ChevronDown,
  ChevronUp,
  Receipt,
  TrendingUp,
  UtensilsCrossed,
  Calendar,
  Filter,
  Eye
} from 'lucide-react';

const API_VENTAS = `${API_BASE}/ventas`;
const API_PRODUCTOS = `${API_BASE}/productos`;

export default function RegistroVentas() {
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState({
    totalRecaudado: 0,
    totalOrdenes: 0,
    ticketPromedio: 0,
    desgloseMetodos: {}
  });
  const [productosMenu, setProductosMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('Todos');

  // Modal Crear / Editar Venta
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    fecha_venta: hoy,
    metodo_pago: 'Efectivo',
    items: []
  });

  // Selector para agregar ítem a la orden
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);

  // Fila expandida para ver ticket detallado
  const [filaExpandida, setFilaExpandida] = useState(null);

  // Modal de Eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState(null);

  // Modal de Reporte y Filtros Dinámicos
  const [reporteModalOpen, setReporteModalOpen] = useState(false);
  const [datosReporte, setDatosReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [reporteFiltroFechas, setReporteFiltroFechas] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    metodo_pago: 'Todos'
  });
  const [seccionesReporte, setSeccionesReporte] = useState({
    metricas: true,
    metodos: true,
    topProductos: true,
    detalleVentas: true
  });

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const cargarVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_VENTAS);
      const data = await res.json();
      if (data.success) {
        setVentas(data.data);
        setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al obtener ventas');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const res = await fetch(API_PRODUCTOS);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setProductosMenu(data.data);
        setProductoSeleccionado(data.data[0].id_producto);
      }
    } catch (err) {
      console.error('Error al cargar menú de productos:', err);
    }
  };

  useEffect(() => {
    cargarVentas();
    cargarProductos();
  }, []);

  // Abrir modal nueva venta
  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      fecha_venta: hoy,
      metodo_pago: 'Efectivo',
      items: []
    });
    setCantidadProducto(1);
    if (productosMenu.length > 0) {
      setProductoSeleccionado(productosMenu[0].id_producto);
    }
    setModalOpen(true);
  };

  // Abrir modal para editar venta pasada
  const abrirModalEditar = (venta) => {
    setModoEdicion(true);
    setIdEditando(venta.id_venta);

    // Mapear partidas existentes
    const itemsExistentes = venta.detalles.map(d => ({
      id_producto: d.id_producto,
      nombre_producto: d.nombre_producto,
      cantidad: d.cantidad,
      precio_unitario: parseFloat(d.precio_unitario),
      subtotal: parseFloat(d.subtotal)
    }));

    setFormData({
      fecha_venta: venta.fecha_venta,
      metodo_pago: venta.metodo_pago,
      items: itemsExistentes
    });
    setCantidadProducto(1);
    setModalOpen(true);
  };

  // Agregar platillo al carrito de la orden
  const agregarItemOrden = () => {
    if (!productoSeleccionado) return;
    const prod = productosMenu.find(p => String(p.id_producto) === String(productoSeleccionado));
    if (!prod) return;

    const cant = parseInt(cantidadProducto, 10);
    if (isNaN(cant) || cant <= 0) {
      showToast('Ingresa una cantidad válida', 'error');
      return;
    }

    const itemsActuales = [...formData.items];
    const indexExistente = itemsActuales.findIndex(i => String(i.id_producto) === String(prod.id_producto));

    if (indexExistente >= 0) {
      itemsActuales[indexExistente].cantidad += cant;
      itemsActuales[indexExistente].subtotal = itemsActuales[indexExistente].cantidad * itemsActuales[indexExistente].precio_unitario;
    } else {
      itemsActuales.push({
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre_producto,
        cantidad: cant,
        precio_unitario: parseFloat(prod.precio),
        subtotal: cant * parseFloat(prod.precio)
      });
    }

    setFormData({ ...formData, items: itemsActuales });
    setCantidadProducto(1);
  };

  // Quitar platillo del carrito
  const removerItemOrden = (index) => {
    const nuevos = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: nuevos });
  };

  // Modificar cantidad en carrito
  const cambiarCantidadItem = (index, delta) => {
    const nuevos = [...formData.items];
    const item = nuevos[index];
    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
      removerItemOrden(index);
      return;
    }
    item.cantidad = nuevaCant;
    item.subtotal = nuevaCant * item.precio_unitario;
    setFormData({ ...formData, items: nuevos });
  };

  // Total de la orden actual
  const totalOrden = formData.items.reduce((acc, it) => acc + it.subtotal, 0);

  // Guardar (Crear o Editar)
  const handleSubmitVenta = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      showToast('Agrega al menos un platillo o bebida a la orden', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_VENTAS}/${idEditando}` : API_VENTAS;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha_venta: formData.fecha_venta,
          metodo_pago: formData.metodo_pago,
          items: formData.items
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(modoEdicion ? 'Venta actualizada exitosamente' : 'Venta registrada exitosamente');
        setModalOpen(false);
        cargarVentas();
      } else {
        showToast(resData.message || 'Error al guardar la venta', 'error');
      }
    } catch (err) {
      console.error('Error al guardar venta:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!ventaAEliminar) return;
    try {
      const res = await fetch(`${API_VENTAS}/${ventaAEliminar.id_venta}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('Venta anulada correctamente');
        setDeleteModalOpen(false);
        setVentaAEliminar(null);
        cargarVentas();
      } else {
        showToast(resData.message || 'Error al eliminar venta', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar venta:', err);
      showToast('Error de conexión con el servidor', 'error');
    }
  };

    // Consultar reporte dinámico con filtros de fecha y método
    const consultarReporte = async (filtros = reporteFiltroFechas) => {
      setCargandoReporte(true);
      try {
        const params = new URLSearchParams();
        if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
        if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
        if (filtros.metodo_pago && filtros.metodo_pago !== 'Todos') {
          params.append('metodo_pago', filtros.metodo_pago);
        }

        const res = await fetch(`${API_VENTAS}/reporte?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setDatosReporte(data.reporte);
        }
      } catch (err) {
        console.error('Error al cargar reporte:', err);
        showToast('Error al consultar el reporte', 'error');
      } finally {
        setCargandoReporte(false);
      }
    };

    // Abrir reporte
    const abrirReporte = () => {
      setReporteModalOpen(true);
      consultarReporte(reporteFiltroFechas);
    };

    // Atajos rápidos de fechas para el reporte
    const aplicarAtajoFechas = (tipo) => {
      const ahora = new Date();
      let inicio = '';
      let fin = ahora.toISOString().split('T')[0];

      if (tipo === 'hoy') {
        inicio = fin;
      } else if (tipo === 'semana') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        inicio = d.toISOString().split('T')[0];
      } else if (tipo === 'mes') {
        const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        inicio = primerDia.toISOString().split('T')[0];
      } else if (tipo === 'todo') {
        inicio = '';
        fin = '';
      }

      const nuevosFiltros = {
        ...reporteFiltroFechas,
        fecha_inicio: inicio,
        fecha_fin: fin
      };
      setReporteFiltroFechas(nuevosFiltros);
      consultarReporte(nuevosFiltros);
    };

    // Imprimir reporte
    const imprimirReporte = () => {
      window.print();
    };


    const ventasFiltradas = ventas.filter(v => {
      const coincideMetodo = filtroMetodo === 'Todos' || v.metodo_pago === filtroMetodo;
      const coincideBusqueda = v.detalles.some(d => d.nombre_producto.toLowerCase().includes(busqueda.toLowerCase())) ||
        v.metodo_pago.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.fecha_venta.includes(busqueda);
      return coincideMetodo && (busqueda === '' || coincideBusqueda);
    });

    return (
      <div className="w-full flex flex-col gap-6 animation-fade-in pb-12">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-bounce">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white font-medium text-sm backdrop-blur-md border ${toast.tipo === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-rose-600/90 border-rose-400'
              }`}>
              {toast.tipo === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{toast.mensaje}</span>
            </div>
          </div>
        )}

        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BadgeDollarSign size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Registro de Ventas</h1>
              <p className="text-slate-400 text-sm">Cobro de comandas, formas de pago, detalle de platillos e historial de ingresos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={abrirReporte}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700/60"
              title="Generar reporte ejecutivo de ventas"
            >
              <FileText size={16} className="text-indigo-400" />
              <span>Generar Reporte</span>
            </button>

            <button
              type="button"
              onClick={cargarVentas}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-medium border border-slate-700/60"
              title="Recargar ventas"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin text-indigo-400' : ''} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={abrirModalCrear}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>Nueva Venta</span>
            </button>
          </div>
        </div>

        {/* KPIs de Ventas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ingresos Totales</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">
                ${Number(resumen.totalRecaudado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-emerald-400 mt-1">Ventas acumuladas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Órdenes Realizadas</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{resumen.totalOrdenes}</h3>
              <p className="text-xs text-slate-400 mt-1">Tickets cobrados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Receipt size={24} />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ticket Promedio</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">
                ${Number(resumen.ticketPromedio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-blue-400 mt-1">Gasto medio por orden</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-purple-500">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Método Preferido</p>
              <h3 className="text-lg font-bold text-white mt-2">
                {Object.entries(resumen.desgloseMetodos || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Efectivo'}
              </h3>
              <p className="text-xs text-purple-400 mt-1">Mayor recaudación</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por platillo o fecha..."
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
            <span className="text-xs font-medium text-slate-400 mr-1">Método:</span>
            {['Todos', 'Efectivo', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Transferencia'].map((met) => {
              const activo = filtroMetodo === met;
              return (
                <button
                  key={met}
                  type="button"
                  onClick={() => setFiltroMetodo(met)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activo
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  {met}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla de Ventas (SIN IDs) */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-700/50 shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw size={28} className="animate-spin text-indigo-400" />
              <p className="text-sm">Cargando ventas...</p>
            </div>
          ) : error ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-white font-semibold text-base">Error al cargar ventas</h4>
              <p className="text-slate-400 text-sm max-w-md">{error}</p>
              <button
                type="button"
                onClick={cargarVentas}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all"
              >
                Reintentar
              </button>
            </div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
              <BadgeDollarSign size={40} className="text-slate-600 mb-2" />
              <h4 className="text-white font-semibold text-base">No hay ventas registradas</h4>
              <p className="text-sm text-slate-500">
                Registra órdenes con el botón "+ Nueva Venta" para reflejarlas en el balance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Método de Pago</th>
                    <th className="py-3.5 px-4">Platillos / Productos Ordenados</th>
                    <th className="py-3.5 px-4 text-right">Total Cobrado ($)</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
                  {ventasFiltradas.map((item, idx) => {
                    const estaExpandida = filaExpandida === idx;
                    const totalNum = parseFloat(item.total);

                    return (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                            {item.fecha_venta}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                              {item.metodo_pago === 'Efectivo' && <DollarSign size={13} className="text-emerald-400" />}
                              {item.metodo_pago.includes('Tarjeta') && <CreditCard size={13} className="text-blue-400" />}
                              {item.metodo_pago === 'Transferencia' && <Wallet size={13} className="text-purple-400" />}
                              {item.metodo_pago}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.detalles.slice(0, 2).map((det, dIdx) => (
                                <span key={dIdx} className="text-xs bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50 text-slate-300">
                                  {det.cantidad}x {det.nombre_producto}
                                </span>
                              ))}
                              {item.detalles.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setFilaExpandida(estaExpandida ? null : idx)}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                >
                                  +{item.detalles.length - 2} más
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-base">
                            ${totalNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setFilaExpandida(estaExpandida ? null : idx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Ver desglose completo de la orden"
                              >
                                {estaExpandida ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => abrirModalEditar(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                title="Editar orden de venta"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setVentaAEliminar(item);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Anular venta"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Fila expandida con el desglose exacto */}
                        {estaExpandida && (
                          <tr className="bg-slate-900/60 border-y border-slate-800">
                            <td colSpan={5} className="py-3 px-6">
                              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Receipt size={14} className="text-emerald-400" />
                                  Detalle de Platillos Ordenados:
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {item.detalles.map((d, dIdx) => (
                                    <div key={dIdx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                                      <span className="text-slate-200">
                                        <strong className="text-emerald-400">{d.cantidad}x</strong> {d.nombre_producto}
                                      </span>
                                      <span className="font-mono text-slate-400">
                                        ${parseFloat(d.subtotal).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Crear / Editar Venta */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <BadgeDollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {modoEdicion ? 'Modificar Orden de Venta' : 'Registrar Nueva Orden'}
                    </h3>
                    <p className="text-xs text-slate-400">Detalle de platillos y método de pago</p>
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

              <form onSubmit={handleSubmitVenta} className="space-y-4">
                {/* Fecha y Método de Pago */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Fecha de Venta *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.fecha_venta}
                      onChange={(e) => setFormData({ ...formData, fecha_venta: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Método de Pago *
                    </label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>

                {/* Sección para agregar platillos al pedido */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UtensilsCrossed size={14} className="text-emerald-400" />
                    Agregar Platillos o Bebidas al Pedido
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <select
                      value={productoSeleccionado}
                      onChange={(e) => setProductoSeleccionado(e.target.value)}
                      className="w-full sm:flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                      {productosMenu.map(p => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre_producto} (${parseFloat(p.precio).toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        min="1"
                        value={cantidadProducto}
                        onChange={(e) => setCantidadProducto(e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center focus:border-indigo-500 outline-none"
                        placeholder="Cant."
                      />

                      <button
                        type="button"
                        onClick={agregarItemOrden}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 whitespace-nowrap"
                      >
                        <Plus size={16} />
                        <span>Agregar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de productos en la orden actual */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Platillos en esta Orden ({formData.items.length})
                  </label>

                  {formData.items.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-slate-900/30 border border-slate-800 text-slate-500 text-xs">
                      No has agregado ningún platillo todavía. Selecciona uno arriba y haz clic en "Agregar".
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {formData.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-white">
                          <div className="flex-1">
                            <p className="font-semibold">{it.nombre_producto}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              ${it.precio_unitario.toFixed(2)} c/u
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                              <button
                                type="button"
                                onClick={() => cambiarCantidadItem(idx, -1)}
                                className="text-slate-400 hover:text-white px-1"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold w-5 text-center">{it.cantidad}</span>
                              <button
                                type="button"
                                onClick={() => cambiarCantidadItem(idx, 1)}
                                className="text-slate-400 hover:text-white px-1"
                              >
                                +
                              </button>
                            </div>

                            <span className="font-mono font-bold text-emerald-400 w-20 text-right">
                              ${it.subtotal.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removerItemOrden(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Quitar platillo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total final */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-200">Total a Cobrar:</span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-400">
                    ${totalOrden.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </span>
                </div>

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
                    disabled={guardando || formData.items.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                  >
                    {guardando ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{modoEdicion ? 'Actualizar Venta' : 'Cobrar Orden'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmación de Eliminación */}
        {deleteModalOpen && ventaAEliminar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">¿Anular esta venta?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Estás a punto de anular la venta del <strong className="text-white">{ventaAEliminar.fecha_venta}</strong> por un monto de <strong className="text-emerald-400">${parseFloat(ventaAEliminar.total).toFixed(2)}</strong> ({ventaAEliminar.metodo_pago}).
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setVentaAEliminar(null);
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
                  Sí, Anular Venta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Generador de Reporte (Imprimible y Dinámico) */}
        {reporteModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in flex justify-center items-center p-4 sm:p-6 md:p-8 print:p-0 print:bg-white print:fixed print:inset-0 print:overflow-visible">
            <div
              id="reporte-venta-imprimible"
              className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-700/80 shadow-2xl relative my-auto max-h-[85vh] flex flex-col overflow-hidden print:max-h-none print:border-none print:shadow-none print:overflow-visible"
            >
              {/* Cabecera del reporte (Fija arriba para no perder de vista los botones) */}
              <div className="flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-slate-700/60 bg-slate-900/95 backdrop-blur-md shrink-0 print:border-b-2 print:border-black print:bg-transparent print:p-0 print:pb-4 print:mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white print:text-black tracking-tight flex items-center gap-2">
                    <Receipt size={24} className="text-emerald-400 print:text-black no-print" />
                    Reporte de venta
                  </h2>
                    <p className="text-xs text-slate-400 print:text-gray-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>Generado el {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })} • FoodERP</span>
                      {datosReporte?.rango && (
                        <span className="font-semibold text-indigo-400 print:text-black">
                          • Período: {datosReporte.rango.fecha_inicio ? datosReporte.rango.fecha_inicio : 'Histórico'} al {datosReporte.rango.fecha_fin ? datosReporte.rango.fecha_fin : 'Presente'}
                        </span>
                      )}
                      {datosReporte?.metodo_pago && datosReporte.metodo_pago !== 'Todos' && (
                        <span className="font-semibold text-emerald-400 print:text-black">
                          • Pago: {datosReporte.metodo_pago}
                        </span>
                      )}
                    </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    type="button"
                    onClick={imprimirReporte}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                    title="Imprimir o Guardar PDF"
                  >
                    <Printer size={16} />
                    <span>Imprimir / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReporteModalOpen(false)}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Cerrar"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Barra de Filtros y Personalización del Reporte (no-print) */}
              <div className="bg-slate-900/90 border-b border-slate-700/60 p-4 md:px-8 space-y-3 shrink-0 no-print">
                {/* Rango de Fechas y Forma de Pago */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                      <Calendar size={13} className="text-indigo-400" />
                      <span className="text-slate-400">Desde:</span>
                      <input
                        type="date"
                        value={reporteFiltroFechas.fecha_inicio}
                        onChange={(e) => {
                          const nuevos = { ...reporteFiltroFechas, fecha_inicio: e.target.value };
                          setReporteFiltroFechas(nuevos);
                          consultarReporte(nuevos);
                        }}
                        className="bg-transparent text-white outline-none text-xs [color-scheme:dark]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                      <Calendar size={13} className="text-indigo-400" />
                      <span className="text-slate-400">Hasta:</span>
                      <input
                        type="date"
                        value={reporteFiltroFechas.fecha_fin}
                        onChange={(e) => {
                          const nuevos = { ...reporteFiltroFechas, fecha_fin: e.target.value };
                          setReporteFiltroFechas(nuevos);
                          consultarReporte(nuevos);
                        }}
                        className="bg-transparent text-white outline-none text-xs [color-scheme:dark]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                      <Filter size={13} className="text-emerald-400" />
                      <select
                        value={reporteFiltroFechas.metodo_pago}
                        onChange={(e) => {
                          const nuevos = { ...reporteFiltroFechas, metodo_pago: e.target.value };
                          setReporteFiltroFechas(nuevos);
                          consultarReporte(nuevos);
                        }}
                        className="bg-transparent text-white outline-none text-xs"
                      >
                        <option value="Todos" className="bg-slate-900">Todos los métodos</option>
                        <option value="Efectivo" className="bg-slate-900">Solo Efectivo</option>
                        <option value="Tarjeta de Débito" className="bg-slate-900">Tarjeta de Débito</option>
                        <option value="Tarjeta de Crédito" className="bg-slate-900">Tarjeta de Crédito</option>
                        <option value="Transferencia" className="bg-slate-900">Transferencia</option>
                      </select>
                    </div>
                  </div>

                  {/* Atajos de Período */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => aplicarAtajoFechas('hoy')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoFechas('semana')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      Últimos 7 días
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoFechas('mes')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      Este Mes
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarAtajoFechas('todo')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      Todo
                    </button>
                  </div>
                </div>

                {/* Toggles de Secciones para modificar lo que el usuario quiere ver */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-400 flex items-center gap-1">
                    <Eye size={13} className="text-indigo-400" />
                    Secciones a incluir en el reporte:
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={seccionesReporte.metricas}
                      onChange={(e) => setSeccionesReporte({ ...seccionesReporte, metricas: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Métricas Clave</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={seccionesReporte.metodos}
                      onChange={(e) => setSeccionesReporte({ ...seccionesReporte, metodos: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Formas de Pago</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={seccionesReporte.topProductos}
                      onChange={(e) => setSeccionesReporte({ ...seccionesReporte, topProductos: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Top Platillos</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={seccionesReporte.detalleVentas}
                      onChange={(e) => setSeccionesReporte({ ...seccionesReporte, detalleVentas: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Detalle de Órdenes</span>
                  </label>
                </div>
              </div>

              {/* Contenido con scroll independiente */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 print:space-y-4 print:p-0 print:overflow-visible">
                {cargandoReporte ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 no-print">
                    <RefreshCw size={28} className="animate-spin text-indigo-400" />
                    <p className="text-sm">Generando reporte dinámico...</p>
                  </div>
                ) : datosReporte ? (
                  <div className="space-y-6 print:space-y-4">
                    {/* Métricas clave */}
                        {seccionesReporte.metricas && (
                    <div className="grid grid-cols-3 gap-3 print:grid-cols-3">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center print:bg-gray-100 print:border-gray-300">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase print:text-gray-600">Total Recaudado</p>
                        <h4 className="text-xl font-bold font-mono text-emerald-400 print:text-black mt-1">
                          ${Number(datosReporte.resumen.total_recaudado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center print:bg-gray-100 print:border-gray-300">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase print:text-gray-600">Órdenes Atendidas</p>
                        <h4 className="text-xl font-bold text-white print:text-black mt-1">
                          {datosReporte.resumen.total_ordenes}
                        </h4>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center print:bg-gray-100 print:border-gray-300">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase print:text-gray-600">Ticket Medio</p>
                        <h4 className="text-xl font-bold font-mono text-indigo-400 print:text-black mt-1">
                          ${Number(datosReporte.resumen.promedio_orden).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </h4>
                      </div>
                    </div>
                  )}

                      {/* Detalles de Venta (Historial con qué compraron) */}
                                {
                                  seccionesReporte.detalleVentas && (
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-black">
                                        Detalles de Venta (Órdenes y Platillos)
                                      </h4>
                                      <div className="overflow-hidden rounded-xl border border-slate-800 print:border-gray-300">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-900/80 text-slate-400 uppercase print:bg-gray-200 print:text-black">
                                            <tr>
                                              <th className="py-2.5 px-3">Fecha</th>
                                              <th className="py-2.5 px-3">Forma de Pago</th>
                                              <th className="py-2.5 px-3">Platillos / Productos</th>
                                              <th className="py-2.5 px-3 text-right">Total ($)</th>
                                            </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-800/60 text-slate-200 print:divide-gray-300 print:text-black">
                                                {(!datosReporte.ventas || datosReporte.ventas.length === 0) ? (
                                                  <tr>
                                                    <td colSpan={4} className="py-3 px-3 text-center text-slate-500">
                                                      No hay ventas registradas en el período seleccionado.
                                                    </td>
                                                  </tr>
                                            ) : (
                              datosReporte.ventas.map((v, vIdx) => (
                                            <tr key={vIdx}>
                                              <td className="py-2 px-3 font-mono text-slate-300 print:text-black whitespace-nowrap">
                                                {v.fecha_venta}
                                              </td>
                                              <td className="py-2 px-3 font-medium whitespace-nowrap">
                                                {v.metodo_pago}
                                              </td>
                                              <td className="py-2 px-3 text-slate-300 print:text-black">
                                                {v.detalles && v.detalles.length > 0
                                                  ? v.detalles.map(d => `${d.cantidad}x ${d.nombre_producto}`).join(', ')
                                                  : 'Sin platillos registrados'}
                                              </td>
                                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 print:text-black whitespace-nowrap">
                                                ${parseFloat(v.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                              </td>
                                            </tr>
                                            ))
                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                  )}

                            {/* Desglose por método de pago */}
                                        {seccionesReporte.metodos && (
                                          <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-black">
                                              Desglose por Forma de Pago
                                            </h4>
                                            <div className="overflow-hidden rounded-xl border border-slate-800 print:border-gray-300">
                                              <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-900/80 text-slate-400 uppercase print:bg-gray-200 print:text-black">
                                                  <tr>
                                                    <th className="py-2.5 px-3">Método</th>
                                                    <th className="py-2.5 px-3 text-center">Transacciones</th>
                                                    <th className="py-2.5 px-3 text-right">Monto Recaudado</th>
                                                  </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/60 text-slate-200 print:divide-gray-300 print:text-black">
                                              {datosReporte.metodos.length === 0 ? (
                                                <tr>
                                                  <td colSpan={3} className="py-3 px-3 text-center text-slate-500">
                                                    Sin registros para los métodos de pago.
                                                  </td>
                                                </tr>
                                              ) : (
                                                datosReporte.metodos.map((m, mIdx) => (
                                                  <tr key={mIdx}>
                                                    <td className="py-2 px-3 font-medium">{m.metodo_pago}</td>
                                                    <td className="py-2 px-3 text-center">{m.cantidad}</td>
                                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                                                      ${parseFloat(m.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                    </td>
                                                  </tr>
                                                ))
                                              )}
                                            </tbody>
                                          </table>
                      </div>
                    </div>
                  )}

                              {/* Platillos más vendidos */}
                                          {seccionesReporte.topProductos && (
                                            <div className="space-y-2">
                                              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider print:text-black">
                                                Top Platillos y Productos Más Vendidos
                                              </h4>
                                              <div className="overflow-hidden rounded-xl border border-slate-800 print:border-gray-300">
                                                <table className="w-full text-left text-xs">
                                                  <thead className="bg-slate-900/80 text-slate-400 uppercase print:bg-gray-200 print:text-black">
                                                    <tr>
                                                      <th className="py-2.5 px-3">Platillo / Bebida</th>
                                                      <th className="py-2.5 px-3 text-center">Unidades Vendidas</th>
                                                      <th className="py-2.5 px-3 text-right">Ingresos Aportados</th>
                                                    </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-800/60 text-slate-200 print:divide-gray-300 print:text-black">
                                                {datosReporte.topProductos.length === 0 ? (
                                                  <tr>
                                                    <td colSpan={3} className="py-3 px-3 text-center text-slate-500">
                                                      Sin ventas registradas de productos en este período.
                                                    </td>
                                                  </tr>
                                                ) : (
                                                  datosReporte.topProductos.map((p, pIdx) => (
                                                    <tr key={pIdx}>
                                                      <td className="py-2 px-3 font-medium">{p.nombre_producto}</td>
                                                      <td className="py-2 px-3 text-center font-bold text-indigo-400 print:text-black">{p.total_vendido}</td>
                                                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                                                        ${parseFloat(p.ingresos_generados).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                      </td>
                                                    </tr>
                                                  ))
                                                )}
                                              </tbody>
                                            </table>
                      </div>
                    </div>
                  )}

                                {/* Pie de reporte */}
                                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center print:text-gray-600 print:border-gray-400">
                                  Reporte de venta oficial generado para auditoría interna y administración comercial.
                                </div>
                              </div>
              ) : null}
                            </div>

                            {/* Barra inferior de acciones (no-print) para fácil acceso */}
                            <div className="p-4 px-6 md:px-8 border-t border-slate-700/60 bg-slate-900/90 flex items-center justify-end gap-3 no-print shrink-0">
                              <button
                                type="button"
                                onClick={() => setReporteModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Cerrar
                              </button>
                              <button
                                type="button"
                                onClick={imprimirReporte}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                              >
                                <Printer size={16} />
                                <span>Imprimir / PDF</span>
                              </button>
                            </div>
                        </div>
                      </div>
      )}
                    </div>
                    );
}

