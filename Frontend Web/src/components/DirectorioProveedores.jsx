import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import {
  Contact2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Truck,
  Building2,
  Beef,
  Apple,
  Croissant,
  Milk,
  Package,
  Zap,
  Filter
} from 'lucide-react';

const API_PROVEEDORES = `${API_BASE}/proveedores`;

export default function DirectorioProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [resumen, setResumen] = useState({
    total_proveedores: 0,
    proveedores_activos: 0,
    total_categorias: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre_comercial: '',
    razon_social: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    categoria_suministro: 'Carnes y Aves',
    dias_entrega: 'Lunes a Viernes',
    estado: 'Activo',
    notas: ''
  });

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria !== 'Todas') params.append('categoria', filtroCategoria);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);

      const res = await fetch(`${API_PROVEEDORES}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProveedores(data.data || []);
        setResumen(data.resumen || {});
      } else {
        showToast(data.message || 'Error al obtener proveedores', 'error');
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, [filtroCategoria, filtroEstado]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      nombre_comercial: '',
      razon_social: '',
      contacto_nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      categoria_suministro: 'Carnes y Aves',
      dias_entrega: 'Lunes a Viernes',
      estado: 'Activo',
      notas: ''
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (prov) => {
    setModoEdicion(true);
    setIdEditando(prov.id_proveedor);
    setFormData({
      nombre_comercial: prov.nombre_comercial,
      razon_social: prov.razon_social || '',
      contacto_nombre: prov.contacto_nombre || '',
      telefono: prov.telefono,
      email: prov.email || '',
      direccion: prov.direccion || '',
      categoria_suministro: prov.categoria_suministro,
      dias_entrega: prov.dias_entrega || 'Bajo Pedido',
      estado: prov.estado,
      notas: prov.notas || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_comercial.trim() || !formData.telefono.trim()) {
      showToast('Nombre comercial y teléfono son requeridos', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_PROVEEDORES}/${idEditando}` : API_PROVEEDORES;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Proveedor guardado correctamente');
        setModalOpen(false);
        cargarProveedores();
      } else {
        showToast(data.message || 'Error al guardar proveedor', 'error');
      }
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!proveedorAEliminar) return;
    try {
      const res = await fetch(`${API_PROVEEDORES}/${proveedorAEliminar.id_proveedor}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proveedor eliminado del directorio');
        setDeleteModalOpen(false);
        setProveedorAEliminar(null);
        cargarProveedores();
      } else {
        showToast(data.message || 'Error al eliminar proveedor', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Filtrado en memoria por búsqueda
  const proveedoresFiltrados = proveedores.filter(p => {
    const texto = busqueda.toLowerCase();
    return p.nombre_comercial.toLowerCase().includes(texto) ||
      p.contacto_nombre.toLowerCase().includes(texto) ||
      p.categoria_suministro.toLowerCase().includes(texto) ||
      p.telefono.includes(texto);
  });

  const getCategoriaIcon = (cat) => {
    switch (cat) {
      case 'Carnes y Aves':
        return <Beef size={14} className="text-rose-400" />;
      case 'Frutas y Verduras':
        return <Apple size={14} className="text-emerald-400" />;
      case 'Panadería y Masas':
        return <Croissant size={14} className="text-amber-400" />;
      case 'Lácteos y Quesos':
        return <Milk size={14} className="text-yellow-300" />;
      case 'Empaques y Desechables':
        return <Package size={14} className="text-cyan-400" />;
      case 'Servicios y Gas':
        return <Zap size={14} className="text-indigo-400" />;
      default:
        return <Truck size={14} className="text-slate-400" />;
    }
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Contact2 className="text-teal-400" size={32} />
            Directorio de Proveedores
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Red de abastecimiento de insumos, carnes, vegetales, empaques y servicios del restaurante
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={cargarProveedores}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-600/30 hover:shadow-teal-600/50 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* KPIs Ejecutivos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Proveedores</p>
          <h3 className="text-2xl font-black text-white mt-2">
            {resumen.total_proveedores || proveedores.length}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Distribuidores registrados en catálogo</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proveedores Activos</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            {resumen.proveedores_activos || 0}
          </h3>
          <p className="text-xs text-emerald-300 mt-1">Disponibles para pedidos inmediatos</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Líneas de Suministro</p>
          <h3 className="text-2xl font-black text-teal-400 mt-2">
            {resumen.total_categorias || 6} Categorías
          </h3>
          <p className="text-xs text-slate-500 mt-1">Carnes, vegetales, abarrotes y servicios</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por empresa, contacto, insumo o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Categoría */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter size={14} className="text-teal-400" />
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="Todas" className="bg-slate-900">Todas las líneas</option>
              <option value="Carnes y Aves" className="bg-slate-900">Carnes y Aves</option>
              <option value="Frutas y Verduras" className="bg-slate-900">Frutas y Verduras</option>
              <option value="Panadería y Masas" className="bg-slate-900">Panadería y Masas</option>
              <option value="Lácteos y Quesos" className="bg-slate-900">Lácteos y Quesos</option>
              <option value="Empaques y Desechables" className="bg-slate-900">Empaques y Desechables</option>
              <option value="Servicios y Gas" className="bg-slate-900">Servicios y Gas</option>
            </select>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="Todos" className="bg-slate-900">Todos los estados</option>
              <option value="Activo" className="bg-slate-900">Solo Activos</option>
              <option value="Inactivo" className="bg-slate-900">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Proveedores (Cero IDs visibles) */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw size={28} className="animate-spin text-teal-400" />
          <p className="text-sm">Consultando directorio de abastecimiento...</p>
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center text-slate-400">
          <Building2 size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-base font-semibold text-slate-300">No se encontraron proveedores</p>
          <p className="text-xs text-slate-500 mt-1">Registra nuevos distribuidores o amplía tus filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedoresFiltrados.map((prov) => {
            const numeroLimpio = prov.telefono.replace(/\D/g, '');
            return (
              <div
                key={prov.id_proveedor}
                className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all shadow-lg"
              >
                {/* Cabecera de la tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {prov.nombre_comercial}
                      </h3>
                      {prov.razon_social && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{prov.razon_social}</p>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${prov.estado === 'Activo'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                      {prov.estado}
                    </span>
                  </div>

                  {/* Badge de Categoría */}
                  <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 w-fit">
                    {getCategoriaIcon(prov.categoria_suministro)}
                    <span className="font-semibold">{prov.categoria_suministro}</span>
                  </div>
                </div>

                {/* Detalles de contacto y entrega */}
                <div className="space-y-2 py-2 border-y border-slate-800/80 text-xs text-slate-300">
                  {prov.contacto_nombre && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 w-20">Contacto:</span>
                      <strong className="text-white font-medium">{prov.contacto_nombre}</strong>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-20">Teléfono:</span>
                    <strong className="text-teal-400 font-mono">{prov.telefono}</strong>
                  </div>

                  {prov.email && (
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-500 w-20">Correo:</span>
                      <span className="text-slate-300 truncate">{prov.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-20">Entregas:</span>
                    <span className="text-indigo-300 font-medium">{prov.dias_entrega}</span>
                  </div>

                  {prov.notas && (
                    <div className="pt-1 text-[11px] text-slate-400 italic line-clamp-2">
                      "{prov.notas}"
                    </div>
                  )}
                </div>

                {/* Acciones de Contacto Rápido y Edición */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {/* Botón WhatsApp */}
                    <a
                      href={`https://wa.me/52${numeroLimpio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Chatear en WhatsApp"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </a>

                    {/* Botón Llamar */}
                    <a
                      href={`tel:${prov.telefono}`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Llamar al proveedor"
                    >
                      <Phone size={14} />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(prov)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Editar proveedor"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProveedorAEliminar(prov);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Eliminar del directorio"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Proveedor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 md:p-8 border border-slate-700/80 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modoEdicion ? 'Modificar Proveedor' : 'Registrar Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-slate-400">Datos de la empresa distribuidora y logística</p>
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
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Comercial del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carnicería & Empacadora La Selecta"
                  value={formData.nombre_comercial}
                  onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuidora del Norte S.A."
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Línea de Suministro *
                  </label>
                  <select
                    value={formData.categoria_suministro}
                    onChange={(e) => setFormData({ ...formData, categoria_suministro: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  >
                    <option value="Carnes y Aves">Carnes y Aves</option>
                    <option value="Frutas y Verduras">Frutas y Verduras</option>
                    <option value="Panadería y Masas">Panadería y Masas</option>
                    <option value="Lácteos y Quesos">Lácteos y Quesos</option>
                    <option value="Empaques y Desechables">Empaques y Desechables</option>
                    <option value="Servicios y Gas">Servicios y Gas</option>
                    <option value="Abarrotes y Varios">Abarrotes y Varios</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Contacto / Agente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Lic. Roberto Garza"
                    value={formData.contacto_nombre}
                    onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Teléfono (Llamadas / WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 55-4433-2211"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-teal-400 font-mono focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Días y Frecuencia de Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Lunes, Miércoles y Viernes"
                    value={formData.dias_entrega}
                    onChange={(e) => setFormData({ ...formData, dias_entrega: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Dirección o Bodega
                </label>
                <input
                  type="text"
                  placeholder="Ej. Central de Abastos, Bodega 4"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estado en Catálogo
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  >
                    <option value="Activo">Activo (Habilitado para pedidos)</option>
                    <option value="Inactivo">Inactivo (Suspendido)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notas u Observaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Precios acordados, condiciones..."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-teal-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-end gap-3">
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
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-teal-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{modoEdicion ? 'Actualizar Proveedor' : 'Guardar Proveedor'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle size={28} />
              <h3 className="text-lg font-bold text-white">¿Eliminar este proveedor?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Estás a punto de retirar de tu directorio comercial a{' '}
              <strong className="text-white">"{proveedorAEliminar?.nombre_comercial}"</strong>.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProveedorAEliminar(null);
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
                Sí, Eliminar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

