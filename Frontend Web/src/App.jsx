import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const hoy = new Date().toISOString().split('T')[0];
  
  const [transacciones, setTransacciones] = useState([
    { fecha: '2026-10-01', ingresos: 4000, gastos: 2400 },
    { fecha: '2026-10-05', ingresos: 3000, gastos: 1398 },
  ]);

  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState('ingresos');
  const [dia, setDia] = useState(hoy);

  const agregarDato = (e) => {
    e.preventDefault();
    if (!monto || !dia) return;

    const montoNum = Number(monto);
    if (isNaN(montoNum)) return;
    
    // Clonamos profundamente los datos para evitar mutación directa
    let nuevosDatos = transacciones.map(t => ({ ...t }));
    const indexExistente = nuevosDatos.findIndex(t => t.fecha === dia);

    if (indexExistente >= 0) {
      // Si la fecha ya existe, sumamos o modificamos
      if (tipo === 'ingresos') {
        nuevosDatos[indexExistente].ingresos += montoNum;
      } else {
        nuevosDatos[indexExistente].gastos += montoNum;
      }
    } else {
      // Si es una fecha nueva, la agregamos
      nuevosDatos.push({
        fecha: dia,
        ingresos: tipo === 'ingresos' ? montoNum : 0,
        gastos: tipo === 'gastos' ? montoNum : 0,
      });
    }

    // Ordenamos cronológicamente por fecha
    nuevosDatos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    setTransacciones(nuevosDatos);
    setMonto(''); // Limpiamos el monto, dejamos la fecha
  };

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

  return (
    <div className="min-h-screen bg-[#0b1121] flex overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      {/* Sidebar Simplificado */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} glass border-r border-slate-800/50 z-20 transition-all duration-300 flex flex-col`}>
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800/50">
          {isSidebarOpen && <span className="font-bold text-xl text-white ml-2">Mini<span className="text-indigo-400">ERP</span></span>}
          <button type="button" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 mx-auto transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2">
          {modules.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'}`}
              >
                <Icon size={20} />
                {isSidebarOpen && <span className="font-medium">{m.name}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen z-10">
        <header className="h-20 glass border-b border-slate-800/50 px-8 flex items-center">
          <span className="text-indigo-400 font-medium bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 text-sm">
            Modo Simplificado Activo
          </span>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {activeModule === 'dashboard' ? (
            <DashboardSimple
              dia={dia}
              setDia={setDia}
              monto={monto}
              setMonto={setMonto}
              tipo={tipo}
              setTipo={setTipo}
              agregarDato={agregarDato}
              transacciones={transacciones}
            />
          ) : (
            <div className="glass-panel rounded-2xl h-full flex items-center justify-center text-slate-500">
              Contenido de Registro Rápido (Próximamente)
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardSimple({
  dia,
  setDia,
  monto,
  setMonto,
  tipo,
  setTipo,
  agregarDato,
  transacciones,
}) {
  return (
    <div className="w-full h-full flex flex-col gap-6 animation-fade-in">
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Formulario (Botones para ingresar datos) */}
        <div className="glass-panel rounded-2xl p-6 w-full xl:w-1/3">
          <h2 className="text-xl font-bold text-white mb-4">Simulador de Movimientos</h2>
          <p className="text-slate-400 text-sm mb-6">Ingresa datos aquí para ver cómo reacciona el gráfico en tiempo real.</p>

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
              <Plus size={20} /> Ingresar al Gráfico
            </button>
          </form>
        </div>

        {/* Gráfico de Recharts */}
        <div className="glass-panel rounded-2xl p-6 w-full xl:w-2/3 min-h-[400px] flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">Balance Financiero (En vivo)</h2>
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

export default App;
