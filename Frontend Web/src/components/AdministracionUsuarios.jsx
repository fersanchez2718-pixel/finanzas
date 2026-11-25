import React, { useState, useEffect } from 'react';
import ConfiguracionUsuario from './ConfiguracionUsuario';
import SuperAdminUsuarios from './SuperAdminUsuarios';
import { useAuth } from '../context/AuthContext';
import {
  UserCog,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserX,
  KeyRound,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Lock,
  User,
  SlidersHorizontal,
  ShieldAlert,
  Palette
} from 'lucide-react';

const API_USUARIOS = 'http://localhost:3000/api/usuarios';

export default function AdministracionUsuarios() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.rol === 'SuperAdmin' || currentUser?.email === 'fernandoramirez@gmail.com';
  const [activeTab, setActiveTab] = useState('configuracion'); // 'configuracion' | 'personal' | 'superadmin'
  const [usuarios, setUsuarios] = useState([]);
  const [resumen, setResumen] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    desgloseRoles: {}
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    email: '',
    password: '',
    rol: 'Cajero',
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
      console.error('Error al cargar usuarios:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [filtroRol, filtroEstado]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      nombre_completo: '',
      username: '',
      email: '',
      password: '',
      rol: 'Cajero',
      estado: 'Activo'
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (usr) => {
    setModoEdicion(true);
    setIdEditando(usr.id_usuario);
    setFormData({
      nombre_completo: usr.nombre_completo,
      username: usr.username,
      email: usr.email,
      password: '', // Vacío: solo si se desea restablecer
      rol: usr.rol,
      estado: usr.estado
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo.trim() || !formData.email.trim() || !formData.rol) {
      showToast('Todos los campos marcados con * son requeridos', 'error');
      return;
    }

    if (!modoEdicion && (!formData.username.trim() || !formData.password.trim())) {
      showToast('Nombre de usuario y contraseña son obligatorios para nuevas cuentas', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_USUARIOS}/${idEditando}` : API_USUARIOS;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Usuario guardado exitosamente');
        setModalOpen(false);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al guardar usuario', 'error');
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardando(false);
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
        showToast('Cuenta de usuario eliminada correctamente');
        setDeleteModalOpen(false);
        setUsuarioAEliminar(null);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al eliminar usuario', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Filtrado en memoria por texto
  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    return u.nombre_completo.toLowerCase().includes(texto) ||
      u.username.toLowerCase().includes(texto) ||
      u.email.toLowerCase().includes(texto) ||
      u.rol.toLowerCase().includes(texto);
  });

  const getBadgeRol = (rol) => {
    switch (rol) {
      case 'Administrador':
        return {
          label: 'Administrador',
          classes: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      case 'Cajero':
        return {
          label: 'Cajero / Ventas',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      case 'Almacen':
        return {
          label: 'Almacén / Cocina',
          classes: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      default:
        return {
          label: rol,
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

      {/* Selector de Submódulos: Configuración vs Gestión de Usuarios */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('configuracion')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'configuracion'
              ? 'bg-[#76B900] text-black shadow-[0_0_15px_rgba(118,185,0,0.35)]'
              : 'text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <UserCog size={18} />
          <span>Configuración de Cuenta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-[#76B900] text-black shadow-[0_0_15px_rgba(118,185,0,0.35)]'
              : 'text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Personal y Accesos del Negocio</span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('superadmin')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'superadmin'
                ? 'bg-[#76B900] text-black shadow-[0_0_15px_rgba(118,185,0,0.35)]'
                : 'text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <ShieldAlert size={18} />
            <span>Cuentas Registradas (SuperAdmin)</span>
          </button>
        )}
      </div>

      {activeTab === 'configuracion' ? (
        <ConfiguracionUsuario />
      ) : activeTab === 'superadmin' && isSuperAdmin ? (
        <SuperAdminUsuarios />
      ) : (
        <>
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <UserCog className="text-[#76B900]" size={32} />
                Gestión de Personal & Roles
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Control de cuentas operativas, cajeros y permisos asignados en el restaurante
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={cargarUsuarios}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Refrescar usuarios"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={abrirModalCrear}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#76B900] hover:bg-[#86CE00] text-black rounded-xl font-bold shadow-[0_0_15px_rgba(118,185,0,0.35)] transition-all active:scale-95 text-sm cursor-pointer"
              >
                <Plus size={18} />
                <span>Crear Usuario Operativo</span>
              </button>
            </div>
          </div>

      {/* KPIs Ejecutivos de Cuentas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuentas Registradas</p>
          <h3 className="text-2xl font-black text-white mt-2">
            {resumen.totalUsuarios || usuarios.length}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Total de operadores en el sistema</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuarios Activos</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">
            {resumen.usuariosActivos || 0}
          </h3>
          <p className="text-xs text-emerald-300 mt-1">Cuentas habilitadas con acceso</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administradores</p>
          <h3 className="text-2xl font-black text-purple-400 mt-2">
            {resumen.desgloseRoles?.Administrador || 1}
          </h3>
          <p className="text-xs text-purple-300 mt-1">Acceso total a finanzas y reportes</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal Operativo</p>
          <h3 className="text-2xl font-black text-amber-400 mt-2">
            {(resumen.desgloseRoles?.Cajero || 0) + (resumen.desgloseRoles?.Almacen || 0)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Cajeros y personal de cocina/almacén</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, username o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rol */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <ShieldCheck size={14} className="text-purple-400" />
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer text-xs"
            >
              <option value="Todos" className="bg-slate-900">Todos los roles</option>
              <option value="Administrador" className="bg-slate-900">Administrador</option>
              <option value="Cajero" className="bg-slate-900">Cajero</option>
              <option value="Almacen" className="bg-slate-900">Almacén / Cocina</option>
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
              <option value="Suspendido" className="bg-slate-900">Suspendidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios (Cero IDs visibles) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={28} className="animate-spin text-purple-400" />
            <p className="text-sm">Consultando cuentas de usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <UserCog size={36} className="mx-auto text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No se encontraron cuentas de usuario</p>
            <p className="text-xs text-slate-500 mt-1">Agrega nuevos usuarios o restablece tus filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Usuario / Operador</th>
                  <th className="py-3.5 px-4 font-semibold">Correo Electrónico</th>
                  <th className="py-3.5 px-4 font-semibold">Rol Asignado</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3.5 px-4 font-semibold">Último Acceso</th>
                  <th className="py-3.5 px-4 font-semibold">Fecha Registro</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {usuariosFiltrados.map((u) => {
                  const badgeRol = getBadgeRol(u.rol);
                  return (
                    <tr key={u.id_usuario} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                            {u.nombre_completo.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.nombre_completo}</div>
                            <div className="text-xs font-mono text-slate-400">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-300 whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeRol.classes}`}>
                          <ShieldCheck size={13} />
                          <span>{badgeRol.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          u.estado === 'Activo'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {u.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {u.ultimo_acceso || 'Sin accesos aún'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {u.fecha_registro}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar usuario o restablecer contraseña"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUsuarioAEliminar(u);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Eliminar usuario"
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
      </>
      )}

      {/* Modal Crear / Editar Usuario */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 md:p-8 border border-slate-700/80 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                  <UserCog size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modoEdicion ? 'Modificar Cuenta de Usuario' : 'Crear Nueva Cuenta'}
                  </h3>
                  <p className="text-xs text-slate-400">Asignación de rol y credenciales de acceso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez González"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>

              {!modoEdicion && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre de Usuario (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. jperez, cajero_turno..."
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@fooderp.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Rol en el Sistema *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                  >
                    <option value="Administrador">Administrador (Total)</option>
                    <option value="Cajero">Cajero / Ventas</option>
                    <option value="Almacen">Almacén / Cocina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                  >
                    <option value="Activo">Activo (Habilitado)</option>
                    <option value="Suspendido">Suspendido (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {modoEdicion ? 'Nueva Contraseña (Dejar vacío para conservar)' : 'Contraseña de Acceso *'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    placeholder={modoEdicion ? '••••••••' : 'Mínimo 6 caracteres'}
                    required={!modoEdicion}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-colors"
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
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{modoEdicion ? 'Actualizar Cuenta' : 'Guardar Cuenta'}</span>
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
              <ShieldAlert size={28} />
              <h3 className="text-lg font-bold text-white">¿Eliminar cuenta de usuario?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Estás a punto de eliminar al usuario{' '}
              <strong className="text-white">"{usuarioAEliminar?.nombre_completo}"</strong> (@{usuarioAEliminar?.username}).
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Esta persona perderá el acceso a la plataforma de administración.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUsuarioAEliminar(null);
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
                Sí, Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

