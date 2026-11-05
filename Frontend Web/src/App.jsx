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
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CatalogoMateriaPrima from './components/CatalogoMateriaPrima';
import GestionInventario from './components/GestionInventario';
import RegistroCompras from './components/RegistroCompras';
import RegistroVentas from './components/RegistroVentas';
import ControlMermas from './components/ControlMermas';

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
  { id: 'usuarios', name: 'Administración de Usuarios', icon: UserCog },
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
      {/* 4 KPIs Financieros Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Ingresos por Ventas</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ${Number(kpis.totalIngresos).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-400 mt-1">Total recaudado</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gastos en Compras</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              ${Number(kpis.totalGastos).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-rose-400 mt-1">Total abastecimiento</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Utilidad Neta</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${kpis.utilidadNeta >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              ${Number(kpis.utilidadNeta).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-indigo-300 mt-1">Margen final en caja</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Margen Operativo</p>
            <h3 className="text-2xl font-extrabold text-purple-400 mt-1">
              {kpis.margen}%
            </h3>
            <p className="text-xs text-purple-300 mt-1">Rentabilidad sobre ventas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <PercentBadge size={24} />
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
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Monto ($)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1 block">Tipo de Movimiento</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="ingresos">Ingreso (Venta)</option>
                <option value="gastos">Gasto (Merma/Pago)</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
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
              className="text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors"
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function PercentBadge() {
  return (
    <div className="font-extrabold text-sm font-mono">%</div>
  );
}

function App() {
  const [activeModule, setActiveModule] = useState('catalogo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
  }, []);

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

  const activeModuleName = modules.find(m => m.id === activeModule)?.name || 'Finanzas y Control';

  return (
    <div className="min-h-screen bg-[#0b1121] flex overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      {/* Sidebar de Navegación */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass border-r border-slate-800/50 z-20 transition-all duration-300 flex flex-col`}>
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/50">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 ml-2">
              <span className="font-bold text-xl text-white">Food<span className="text-orange-400">ERP</span></span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 mx-auto transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-lg shadow-indigo-500/10'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }`}
                title={m.name}
              >
                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                {isSidebarOpen && <span className="font-medium text-sm text-left truncate">{m.name}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen z-10 overflow-hidden">
        {/* Header Superior */}
        <header className="h-20 glass border-b border-slate-800/50 px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-lg hidden sm:block">
              {activeModuleName}
            </h2>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sistema en línea</span>
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

          {!['dashboard', 'catalogo', 'inventario', 'compras', 'mermas', 'ventas'].includes(activeModule) && (
            <div className="glass-panel rounded-2xl h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Package size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">Módulo de {activeModuleName}</h3>
              <p className="text-sm text-slate-500 max-w-sm text-center">
                Módulo en fase de integración para el control administrativo de la cocina.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
