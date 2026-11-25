import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Lock,
  User,
  Store,
  Mail,
  ShieldCheck,
  ShieldX,
  Power,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_USUARIOS = 'http://localhost:3000/api/usuarios';

export default function SuperAdminUsuarios() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [resumen, setResumen] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosSuspendidos: 0,
    desgloseRoles: {}
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    nombre_negocio: '',
    email: '',
    password: '',
    rol: 'Administrador',
    estado: 'Activo'
  });

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroRol !== 'Todos') params.append('rol', filtroRol);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);

      const res = await fetch(`${API_USUARIOS}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.data || []);
        setResumen(data.resumen || {});
      } else {
        showToast(data.message || 'Error al obtener usuarios', 'error');
      }
    } catch (err) {
      console.error('Error al cargar cuentas globales:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [filtroRol, filtroEstado]);

  const abrirModalEditar = (usr) => {
    setUsuarioEditando(usr);
    setFormData({
      nombre_completo: usr.nombre_completo || '',
      nombre_negocio: usr.nombre_negocio || '',
      email: usr.email || '',
      password: '', // Vacío: solo si se desea restablecer contraseña
      rol: usr.rol || 'Administrador',
      estado: usr.estado || 'Activo'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo.trim() || !formData.email.trim()) {
      showToast('Nombre y correo son requeridos', 'error');
      return;
    }

    if (formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) {
      showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_USUARIOS}/${usuarioEditando.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Cuenta actualizada exitosamente');
        setModalOpen(false);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al actualizar cuenta', 'error');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstadoUsuario = async (usr) => {
    if (usr.email === 'fernandoramirez@gmail.com') {
      showToast('La cuenta principal de Fernando Ramírez no puede ser suspendida', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_USUARIOS}/${usr.id_usuario}/toggle-estado`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al cambiar estado', 'error');
      }
    } catch (err) {
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  const confirmarEliminar = async () => {
    if (!usuarioAEliminar) return;
    try {
      const res = await fetch(`${API_USUARIOS}/${usuarioAEliminar.id_usuario}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cuenta de usuario eliminada de la plataforma');
        setDeleteModalOpen(false);
        setUsuarioAEliminar(null);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al eliminar cuenta', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Filtrado en memoria
  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    return (
      (u.nombre_completo || '').toLowerCase().includes(texto) ||
      (u.nombre_negocio || '').toLowerCase().includes(texto) ||
      (u.username || '').toLowerCase().includes(texto) ||
      (u.email || '').toLowerCase().includes(texto) ||
      (u.rol || '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="w-full flex flex-col gap-6 animation-fade-in pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm backdrop-blur-md border ${
              toast.tipo === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-600/50'
                : 'bg-emerald-950/90 text-emerald-200 border-[#76B900]/50'
            }`}
          >
            {toast.tipo === 'error' ? <AlertCircle size={18} className="text-rose-400" /> : <CheckCircle2 size={18} className="text-[#76B900]" />}
            <span>{toast.mensaje}</span>
          </div>
        </div>
      )}

      {/* Cabecera del Panel de SuperAdmin */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#76B900]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#76B900]/15 border border-[#76B900]/30 text-[#76B900] flex items-center justify-center shadow-[0_0_20px_rgba(118,185,0,0.25)]">
            <ShieldAlert size={34} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Panel de Super Administrador
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/40">
                Acceso Maestro
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Control centralizado de todas las cuentas y empresas registradas en la plataforma FoodERP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarUsuarios}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-sm font-semibold cursor-pointer"
            title="Refrescar cuentas"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin text-[#76B900]' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 4 Métricas Globales de Cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 border-l-4 border-l-[#76B900]">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas Registradas</p>
          <h3 className="text-2xl font-black text-white mt-1.5">
            {resumen.totalUsuarios || usuarios.length}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Negocios y dueños en la plataforma</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas Activas</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1.5">
            {resumen.usuariosActivos || 0}
          </h3>
          <p className="text-xs text-emerald-300 mt-1">Con acceso habilitado al sistema</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 border-l-4 border-l-rose-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas Suspendidas</p>
          <h3 className="text-2xl font-black text-rose-400 mt-1.5">
            {resumen.usuariosSuspendidos || 0}
          </h3>
          <p className="text-xs text-rose-300 mt-1">Acceso restringido temporalmente</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dueños / Administradores</p>
          <h3 className="text-2xl font-black text-amber-400 mt-1.5">
            {resumen.desgloseRoles?.Administrador || 0}
          </h3>
          <p className="text-xs text-amber-300 mt-1">Empresas autónomas en ceros</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por dueño, nombre de restaurante o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#76B900] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rol */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-400">Rol:</span>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="Todos" className="bg-slate-900">Todos los roles</option>
              <option value="Administrador" className="bg-slate-900">Administrador</option>
              <option value="SuperAdmin" className="bg-slate-900">SuperAdmin</option>
            </select>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300">
            <span className="text-slate-400">Estado:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="Todos" className="bg-slate-900">Todos los estados</option>
              <option value="Activo" className="bg-slate-900">Activos</option>
              <option value="Suspendido" className="bg-slate-900">Suspendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Global de Cuentas (Cero IDs de base de datos) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-[#76B900]" />
            <p className="text-sm">Cargando cuentas registradas en la plataforma...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Store size={40} className="mx-auto text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No se encontraron cuentas con los filtros seleccionados</p>
            <p className="text-xs text-slate-500 mt-1">Prueba restableciendo los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Dueño / Titular</th>
                  <th className="py-3.5 px-4 font-semibold">Empresa / Restaurante</th>
                  <th className="py-3.5 px-4 font-semibold">Correo Electrónico</th>
                  <th className="py-3.5 px-4 font-semibold">Rol</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-semibold">Último Acceso</th>
                  <th className="py-3.5 px-4 font-semibold">Fecha Registro</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Acciones SuperAdmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {usuariosFiltrados.map((u) => {
                  const isFernando = u.email === 'fernandoramirez@gmail.com';
                  return (
                    <tr key={u.id_usuario} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isFernando
                              ? 'bg-[#76B900] text-black shadow-[0_0_10px_rgba(118,185,0,0.3)]'
                              : 'bg-slate-800 text-white border border-slate-700'
                          }`}>
                            {(u.nombre_completo || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{u.nombre_completo}</span>
                              {isFernando && (
                                <span className="text-[9px] font-black uppercase bg-[#76B900]/20 text-[#76B900] px-1.5 py-0.2 rounded border border-[#76B900]/40">
                                  Tú
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-slate-200 font-medium">
                          <Store size={15} className="text-[#76B900] shrink-0" />
                          <span className="truncate max-w-[200px]">{u.nombre_negocio || 'Restaurante'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-300 whitespace-nowrap">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          u.rol === 'SuperAdmin'
                            ? 'bg-[#76B900]/15 text-[#76B900] border-[#76B900]/30'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}>
                          <ShieldCheck size={12} />
                          <span>{u.rol}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleEstadoUsuario(u)}
                          disabled={isFernando}
                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            u.estado === 'Activo'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
                          } ${isFernando ? 'opacity-70 cursor-default' : ''}`}
                          title={isFernando ? 'Cuenta protegida' : 'Haz clic para alternar estado (Activar / Suspender)'}
                        >
                          {u.estado}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {u.ultimo_acceso || 'Sin accesos'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {u.fecha_registro}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(u)}
                            className="p-2 rounded-xl text-slate-300 hover:text-[#76B900] bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
                            title="Editar datos o restablecer contraseña"
                          >
                            <Edit2 size={15} />
                          </button>

                          {!isFernando && (
                            <button
                              type="button"
                              onClick={() => {
                                setUsuarioAEliminar(u);
                                setDeleteModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-900/60 hover:bg-rose-500/10 border border-slate-700/80 transition-colors cursor-pointer"
                              title="Eliminar cuenta de la plataforma"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
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

      {/* Modal Editar Cuenta (SuperAdmin) */}
      {modalOpen && usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animation-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#76B900]/20 text-[#76B900] rounded-xl">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Editar Cuenta de Usuario</h3>
                  <p className="text-xs text-slate-400">Modificación administrativa de datos y accesos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#76B900] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Restaurante / Empresa</label>
                <input
                  type="text"
                  value={formData.nombre_negocio}
                  onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#76B900] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#76B900] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rol en Plataforma</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    disabled={usuarioEditando.email === 'fernandoramirez@gmail.com'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#76B900] outline-none"
                  >
                    <option value="Administrador">Administrador (Dueño)</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Estado de la Cuenta</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    disabled={usuarioEditando.email === 'fernandoramirez@gmail.com'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#76B900] outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
                </div>
              </div>

              {/* Restablecer Contraseña */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Lock size={14} className="text-[#76B900]" />
                  <span>Restablecer Contraseña (Opcional)</span>
                </div>
                <input
                  type="password"
                  placeholder="Nueva contraseña (dejar en blanco para mantener)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-black/30 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-[#76B900] outline-none"
                />
                <p className="text-[11px] text-slate-400">Si el usuario olvidó su acceso, ingresa una nueva contraseña aquí.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 rounded-xl bg-[#76B900] hover:bg-[#86CE00] text-black font-bold text-sm shadow-[0_0_15px_rgba(118,185,0,0.35)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteModalOpen && usuarioAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animation-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-white">¿Eliminar cuenta de usuario?</h3>
            </div>
            <p className="text-sm text-slate-300 mb-2">
              Estás a punto de eliminar la cuenta de <strong>{usuarioAEliminar.nombre_completo}</strong> ({usuarioAEliminar.email}), perteneciente a <strong>{usuarioAEliminar.nombre_negocio || 'Restaurante'}</strong>.
            </p>
            <p className="text-xs text-rose-300 mb-6 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              ⚠️ Esta acción removerá el acceso de esta persona a la plataforma.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminar}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Sí, Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
