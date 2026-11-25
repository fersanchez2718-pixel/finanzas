import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Carrot,
  Package,
  ShoppingCart,
  Trash2,
  BadgeDollarSign,
  Receipt,
  Users,
  Contact2,
  UserCog,
  Menu,
  X,
  Plus,
  DollarSign,
  TrendingUp,
  Sun,
  Moon,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  Sparkles,
  Store,
  ShieldAlert,
  Wifi,
  WifiOff,
  RotateCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import LoginScreen from './components/LoginScreen';
import AuthModal from './components/AuthModal';

import CatalogoMateriaPrima from './components/CatalogoMateriaPrima';
import GestionInventario from './components/GestionInventario';
import RegistroCompras from './components/RegistroCompras';
import RegistroVentas from './components/RegistroVentas';
import ControlMermas from './components/ControlMermas';
import GastosOperativos from './components/GastosOperativos';
import NominaSueldos from './components/NominaSueldos';
import DirectorioProveedores from './components/DirectorioProveedores';
import AdministracionUsuarios from './components/AdministracionUsuarios';
import SuperAdminUsuarios from './components/SuperAdminUsuarios';

const modules = [
  { id: 'dashboard', name: 'Dashboard Central', icon: LayoutDashboard },
  { id: 'catalogo', name: 'Catálogo de Materia Prima', icon: Carrot },
  { id: 'inventario', name: 'Gestión de Inventario', icon: Package },
  { id: 'compras', name: 'Registro de Compras', icon: ShoppingCart },
  { id: 'mermas', name: 'Control de Mermas', icon: Trash2 },
  { id: 'ventas', name: 'Registro de Ventas', icon: BadgeDollarSign },
  { id: 'gastos', name: 'Gastos Operativos', icon: Receipt },
  { id: 'nomina', name: 'Nómina y Sueldos', icon: Users },
  { id: 'proveedores', name: 'Directorio de Proveedores', icon: Contact2 },
  { id: 'usuarios', name: 'Configuración & Usuarios', icon: UserCog },
];

function DashboardSimple({
  dia,
  setDia,
  monto,
  setMonto,
  tipo,
  setTipo,
  agregarDato,
  transacciones,
  kpis,
  cargarBalance
}) {
  return (
    <div className="w-full h-full flex flex-col gap-6 animation-fade-in pb-8">
      {/* 4 KPIs Financieros Consolidados con Acento NVIDIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-[#76B900]">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ingresos por Ventas</p>
            <h3 className="text-2xl font-black text-white mt-1">
              ${Number(kpis?.totalIngresos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-[#76B900] mt-1">Total recaudado</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#76B900]/15 text-[#76B900] flex items-center justify-center shadow-[0_0_15px_rgba(118,185,0,0.2)]">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Egresos Totales</p>
            <h3 className="text-2xl font-black text-white mt-1">
              ${Number(kpis?.totalGastos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-400 mt-1">Compras, nómina y gastos</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Receipt size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-[#76B900]">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Utilidad Neta</p>
            <h3 className={`text-2xl font-black mt-1 ${(kpis?.utilidadNeta || 0) >= 0 ? 'text-[#76B900]' : 'text-rose-400'}`}>
              ${Number(kpis?.utilidadNeta || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Margen final en caja</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#76B900]/15 text-[#76B900] flex items-center justify-center shadow-[0_0_15px_rgba(118,185,0,0.2)]">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Margen Operativo</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {kpis?.margen ?? 0}%
            </h3>
            <p className="text-xs text-emerald-300 mt-1">Rentabilidad sobre ventas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-extrabold text-sm font-mono">
            %
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Formulario (Registro de Flujo Rápido) */}
        <div className="glass-panel rounded-2xl p-6 w-full xl:w-1/3">
          <h2 className="text-xl font-bold text-white mb-2">Registro de Flujo</h2>
          <p className="text-slate-400 text-sm mb-6">Ingresa un movimiento para actualizar el balance financiero.</p>

          <form onSubmit={agregarDato} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Fecha de Movimiento</label>
              <input
                type="date"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-[#76B900] outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Monto ($)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-[#76B900] outline-none transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Tipo de Movimiento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-[#76B900] outline-none transition-colors"
              >
                <option value="ingresos">Ingreso (Venta)</option>
                <option value="gastos">Gasto (Merma/Pago)</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-4 w-full bg-[#76B900] hover:bg-[#86CE00] text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(118,185,0,0.35)] active:scale-[0.98] cursor-pointer"
            >
              <Plus size={20} /> Registrar Movimiento
            </button>
          </form>
        </div>

        {/* Gráfico de Recharts */}
        <div className="glass-panel rounded-2xl p-6 w-full xl:w-2/3 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Balance de Ingresos y Gastos</h2>
            <button
              type="button"
              onClick={cargarBalance}
              className="text-xs text-[#76B900] hover:text-[#86CE00] bg-[#76B900]/10 px-3 py-1.5 rounded-lg border border-[#76B900]/30 transition-colors cursor-pointer"
            >
              Actualizar Gráfico
            </button>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transacciones} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="fecha" stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#080B10', borderColor: '#76B900', borderRadius: '12px', color: '#fff', boxShadow: '0 0 20px rgba(118,185,0,0.2)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#76B900" strokeWidth={3} dot={{ r: 4, fill: '#76B900', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { user, isAuthenticated, logout, isOnline, pendingOfflineCount, syncNow, syncToast } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  // Si no ha iniciado sesión, mostrar directamente la ventana de inicio de sesión o registro
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Fernando Ramírez como SuperAdmin tiene acceso exclusivo a la gestión global de cuentas
  const isSuperAdmin = user?.rol === 'SuperAdmin' || user?.email === 'fernandoramirez@gmail.com';

  const visibleModules = isSuperAdmin
    ? [
        ...modules,
        { id: 'superadmin', name: 'Gestión Cuentas', icon: ShieldAlert }
      ]
    : modules;

  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal de autenticación
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const hoy = new Date().toISOString().split('T')[0];

  const [transacciones, setTransacciones] = useState([]);
  const [kpisDashboard, setKpisDashboard] = useState({
    totalIngresos: 0,
    totalGastos: 0,
    utilidadNeta: 0,
    margen: 0
  });

  const cargarBalance = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/dashboard/balance');
      const data = await res.json();
      if (data.success && data.transacciones) {
        setTransacciones(data.transacciones);
        setKpisDashboard(data.kpis);
      }
    } catch (e) {
      console.error('Error al cargar balance del dashboard:', e);
    }
  };

  useEffect(() => {
    cargarBalance();
  }, [user]);

  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('ingresos');
  const [dia, setDia] = useState(hoy);

  const agregarDato = (e) => {
    e.preventDefault();
    if (!monto || !dia) return;

    const montoNum = Number(monto);
    if (isNaN(montoNum)) return;

    let nuevosDatos = transacciones.map(t => ({ ...t }));
    const indexExistente = nuevosDatos.findIndex(t => t.fecha === dia);

    if (indexExistente >= 0) {
      if (tipo === 'ingresos') {
        nuevosDatos[indexExistente].ingresos += montoNum;
      } else {
        nuevosDatos[indexExistente].gastos += montoNum;
      }
    } else {
      nuevosDatos.push({
        fecha: dia,
        ingresos: tipo === 'ingresos' ? montoNum : 0,
        gastos: tipo === 'gastos' ? montoNum : 0,
      });
    }

    nuevosDatos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    setTransacciones(nuevosDatos);
    setMonto('');
  };

  const activeModuleName = visibleModules.find(m => m.id === activeModule)?.name || 'Finanzas y Control';

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex overflow-hidden transition-colors duration-300">
      {/* Background glow effects estilo NVIDIA */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#76B900]/5 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[140px]" />
      </div>

      {/* Sidebar de Navegación con Acentos NVIDIA */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass border-r border-[var(--border-card)] z-20 transition-all duration-300 flex flex-col`}>
        <div className="h-20 flex items-center justify-between px-4 border-b border-[var(--border-card)]">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#76B900] shadow-[0_0_8px_#76B900]" />
              <span className="font-black text-xl tracking-tight">
                Food<span className="text-[#76B900]">ERP</span>
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 mx-auto transition-colors cursor-pointer"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {visibleModules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#76B900]/15 text-[#76B900] border border-[#76B900]/30 shadow-[0_0_15px_rgba(118,185,0,0.15)] font-bold'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                }`}
                title={m.name}
              >
                <Icon size={20} className={isActive ? 'text-[#76B900]' : 'text-slate-400'} />
                {isSidebarOpen && <span className="text-sm text-left truncate">{m.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen z-10 overflow-hidden">
        {/* Header Superior con Perfil, Negocio y Conmutador de Temas */}
        <header className="h-20 glass border-b border-[var(--border-card)] px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg hidden sm:block">
              {activeModuleName}
            </h2>
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>•</span>
              <Store size={14} className="text-[#76B900]" />
              <span className="text-slate-300 font-semibold">{user?.nombre_negocio || 'Mi Negocio'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Conmutador de Tema (Modo Claro / Oscuro) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-700/60 hover:border-[#76B900]/60 bg-slate-900/40 hover:bg-slate-800 text-slate-300 hover:text-[#76B900] transition-all cursor-pointer shadow-sm"
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Indicador de Conectividad & Sincronización Offline */}
            {!isOnline ? (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 font-semibold"
                title="Sin conexión a internet. Los cambios se guardan en tu dispositivo y se enviarán automáticamente al reconectar."
              >
                <WifiOff size={14} className="text-amber-400" />
                <span>Modo Offline ({pendingOfflineCount} pend.)</span>
              </div>
            ) : pendingOfflineCount > 0 ? (
              <button
                type="button"
                onClick={syncNow}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 font-semibold cursor-pointer animate-pulse hover:bg-blue-500/25 transition-colors"
                title="Haz clic para sincronizar los cambios pendientes con el servidor"
              >
                <RotateCw size={14} className="animate-spin text-blue-400" />
                <span>Sincronizando ({pendingOfflineCount})</span>
              </button>
            ) : (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#76B900]/10 border border-[#76B900]/25 text-xs text-[#76B900] font-semibold">
                <Wifi size={13} className="text-[#76B900]" />
                <span>En Línea</span>
              </div>
            )}

            {/* Usuario Autenticado / Botón de Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModule('usuarios')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-700/60 bg-slate-900/40 hover:border-[#76B900]/40 transition-all text-left cursor-pointer"
                  title="Configurar Perfil y Temas"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#76B900] text-black font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(118,185,0,0.4)]">
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                      {user?.nombre_completo}
                    </div>
                    <div className="text-[10px] text-[#76B900] leading-none mt-0.5">
                      {user?.rol || 'Administrador'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    cargarBalance();
                  }}
                  className="p-2.5 rounded-xl border border-slate-700/60 hover:border-rose-500/50 bg-slate-900/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#76B900] hover:bg-[#86CE00] text-black shadow-[0_0_15px_rgba(118,185,0,0.35)] transition-all cursor-pointer active:scale-95"
                >
                  <LogIn size={15} />
                  <span>Iniciar Sesión</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('register');
                    setAuthModalOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:border-[#76B900]/60 bg-slate-900/40 text-slate-200 transition-all cursor-pointer"
                >
                  <UserPlus size={15} className="text-[#76B900]" />
                  <span>Crear Cuenta</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Contenido Dinámico del Módulo */}
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {activeModule === 'dashboard' && (
            <DashboardSimple
              dia={dia}
              setDia={setDia}
              monto={monto}
              setMonto={setMonto}
              tipo={tipo}
              setTipo={setTipo}
              agregarDato={agregarDato}
              transacciones={transacciones}
              kpis={kpisDashboard}
              cargarBalance={cargarBalance}
            />
          )}

          {activeModule === 'catalogo' && (
            <CatalogoMateriaPrima />
          )}

          {activeModule === 'inventario' && (
            <GestionInventario />
          )}

          {activeModule === 'compras' && (
            <RegistroCompras />
          )}

          {activeModule === 'mermas' && (
            <ControlMermas />
          )}

          {activeModule === 'ventas' && (
            <RegistroVentas />
          )}

          {activeModule === 'gastos' && (
            <GastosOperativos />
          )}

          {activeModule === 'nomina' && (
            <NominaSueldos />
          )}

          {activeModule === 'proveedores' && (
            <DirectorioProveedores />
          )}

          {activeModule === 'usuarios' && (
            <AdministracionUsuarios />
          )}

          {activeModule === 'superadmin' && isSuperAdmin && (
            <SuperAdminUsuarios />
          )}
        </div>
      </main>

      {/* Notificación de sincronización offline */}
      {syncToast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm bg-emerald-950/95 text-emerald-200 border border-[#76B900]/50 backdrop-blur-md">
            <Sparkles size={18} className="text-[#76B900]" />
            <span>{syncToast}</span>
          </div>
        </div>
      )}

      {/* Modal de Autenticación (Login / Registro en Ceros) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          cargarBalance();
        }}
        defaultTab={authModalTab}
      />
    </div>
  );
}

export default App;
