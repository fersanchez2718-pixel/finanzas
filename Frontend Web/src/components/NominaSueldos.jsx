import React, { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';
import {
  Users,
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
  Printer,
  FileText,
  BadgeDollarSign,
  UserCheck,
  UserX,
  Briefcase,
  Phone,
  Calculator,
  Receipt
} from 'lucide-react';

const API_NOMINA = `${API_BASE}/nomina`;

export default function NominaSueldos() {
  const [activeTab, setActiveTab] = useState('pagos'); // 'pagos' | 'empleados'
  const [empleados, setEmpleados] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState({
    totalEmpleados: 0,
    empleadosActivos: 0,
    costoDiarioPlantilla: 0,
    costoSemanalProyectado: 0,
    costoMensualProyectado: 0,
    totalDispersadoHistorico: 0,
    totalRecibosEmitidos: 0
  });
  const [loading, setLoading] = useState(true);

  // Búsqueda y Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEmpleado, setFiltroEmpleado] = useState('Todos');

  // Modales
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [guardandoPago, setGuardandoPago] = useState(false);

  const [modalEmpleadoOpen, setModalEmpleadoOpen] = useState(false);
  const [modoEdicionEmpleado, setModoEdicionEmpleado] = useState(false);
  const [idEmpleadoEditando, setIdEmpleadoEditando] = useState(null);
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);

  // Modal Recibo Individual Imprimible
  const [reciboModalOpen, setReciboModalOpen] = useState(false);
  const [reciboSeleccionado, setReciboSeleccionado] = useState(null);

  // Modal Anular Pago
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const hoy = new Date().toISOString().split('T')[0];

  // Formulario Pago de Nómina
  const [pagoForm, setPagoForm] = useState({
    id_empleado: '',
    fecha_pago: hoy,
    periodo: 'Semana Actual',
    dias_trabajados: 6,
    sueldo_diario: 0,
    bonos: 0,
    deducciones: 0,
    metodo_pago: 'Efectivo',
    notas: ''
  });

  // Formulario Empleado
  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: '',
    puesto: 'Cocinero',
    telefono: '',
    sueldo_diario: '',
    fecha_ingreso: hoy,
    estado: 'Activo',
    experiencia_laboral: ''
  });

  const showToast = (mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resEmp, resPag, resRes] = await Promise.all([
        fetch(`${API_NOMINA}/empleados`),
        fetch(`${API_NOMINA}/pagos`),
        fetch(`${API_NOMINA}/resumen`)
      ]);

      const dataEmp = await resEmp.json();
      const dataPag = await resPag.json();
      const dataRes = await resRes.json();

      if (dataEmp.success) {
        setEmpleados(dataEmp.data || []);
        if (dataEmp.data && dataEmp.data.length > 0 && !pagoForm.id_empleado) {
          const primerEmp = dataEmp.data[0];
          setPagoForm(prev => ({
            ...prev,
            id_empleado: primerEmp.id_empleado,
            sueldo_diario: primerEmp.sueldo_diario
          }));
        }
      }

      if (dataPag.success) {
        setPagos(dataPag.data || []);
      }

      if (dataRes.success) {
        setResumen(dataRes.resumen || {});
      }
    } catch (err) {
      console.error('Error al cargar datos de nómina:', err);
      showToast('Error de conexión al cargar nómina', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Al cambiar empleado en el formulario de pago, auto-asignar su sueldo diario
  const handleCambioEmpleadoPago = (id) => {
    const emp = empleados.find(e => String(e.id_empleado) === String(id));
    setPagoForm(prev => ({
      ...prev,
      id_empleado: id,
      sueldo_diario: emp ? emp.sueldo_diario : prev.sueldo_diario
    }));
  };

  // Cálculo en vivo del total del pago
  const subtotalPago = (parseInt(pagoForm.dias_trabajados || 0, 10)) * parseFloat(pagoForm.sueldo_diario || 0);
  const totalPagoCalculado = Math.max(0, subtotalPago + parseFloat(pagoForm.bonos || 0) - parseFloat(pagoForm.deducciones || 0));

  const handleCrearPago = async (e) => {
    e.preventDefault();
    if (!pagoForm.id_empleado) {
      showToast('Selecciona un colaborador', 'error');
      return;
    }

    setGuardandoPago(true);
    try {
      const res = await fetch(`${API_NOMINA}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Pago registrado exitosamente');
        setModalPagoOpen(false);
        cargarDatos();
      } else {
        showToast(data.message || 'Error al procesar el pago', 'error');
      }
    } catch (err) {
      console.error('Error al registrar pago:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardandoPago(false);
    }
  };

  // Crear / Editar Empleado
  const handleCrearEditarEmpleado = async (e) => {
    e.preventDefault();
    if (!empleadoForm.nombre.trim()) {
      showToast('El nombre del colaborador es obligatorio', 'error');
      return;
    }
    const s = parseFloat(empleadoForm.sueldo_diario);
    if (isNaN(s) || s <= 0) {
      showToast('Ingresa un sueldo diario válido', 'error');
      return;
    }

    setGuardandoEmpleado(true);
    try {
      const url = modoEdicionEmpleado ? `${API_NOMINA}/empleados/${idEmpleadoEditando}` : `${API_NOMINA}/empleados`;
      const method = modoEdicionEmpleado ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empleadoForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Colaborador guardado correctamente');
        setModalEmpleadoOpen(false);
        cargarDatos();
      } else {
        showToast(data.message || 'Error al guardar colaborador', 'error');
      }
    } catch (err) {
      console.error('Error al guardar empleado:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardandoEmpleado(false);
    }
  };

  const abrirModalCrearEmpleado = () => {
    setModoEdicionEmpleado(false);
    setIdEmpleadoEditando(null);
    setEmpleadoForm({
      nombre: '',
      puesto: 'Cocinero',
      telefono: '',
      sueldo_diario: '',
      fecha_ingreso: hoy,
      estado: 'Activo',
      experiencia_laboral: ''
    });
    setModalEmpleadoOpen(true);
  };

  const abrirModalEditarEmpleado = (emp) => {
    setModoEdicionEmpleado(true);
    setIdEmpleadoEditando(emp.id_empleado);
    setEmpleadoForm({
      nombre: emp.nombre,
      puesto: emp.puesto,
      telefono: emp.telefono || '',
      sueldo_diario: emp.sueldo_diario,
      fecha_ingreso: emp.fecha_ingreso,
      estado: emp.estado,
      experiencia_laboral: emp.experiencia_laboral || ''
    });
    setModalEmpleadoOpen(true);
  };

  const confirmarAnularPago = async () => {
    if (!pagoAEliminar) return;
    try {
      const res = await fetch(`${API_NOMINA}/pagos/${pagoAEliminar.id_pago}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Recibo de nómina anulado correctamente');
        setDeleteModalOpen(false);
        setPagoAEliminar(null);
        cargarDatos();
      } else {
        showToast(data.message || 'Error al anular pago', 'error');
      }
    } catch (err) {
      console.error('Error al anular pago:', err);
      showToast('Error de conexión', 'error');
    }
  };

  // Filtrado de pagos
  const pagosFiltrados = pagos.filter(p => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = p.nombre_empleado.toLowerCase().includes(texto) ||
      p.puesto_empleado.toLowerCase().includes(texto) ||
      p.periodo.toLowerCase().includes(texto) ||
      p.metodo_pago.toLowerCase().includes(texto);
    const coincideEmpleado = filtroEmpleado === 'Todos' || String(p.id_empleado) === String(filtroEmpleado);
    return coincideTexto && coincideEmpleado;
  });

  // Filtrado de empleados
  const empleadosFiltrados = empleados.filter(e => {
    const texto = busqueda.toLowerCase();
    return e.nombre.toLowerCase().includes(texto) ||
      e.puesto.toLowerCase().includes(texto) ||
      (e.telefono && e.telefono.includes(texto));
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="text-indigo-400" size={32} />
            Nómina y Sueldos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestión de colaboradores, cálculo de sueldos y dispersión periódica de nómina
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={cargarDatos}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={abrirModalCrearEmpleado}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-sm font-semibold transition-all flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Nuevo Colaborador</span>
          </button>
          <button
            type="button"
            onClick={() => setModalPagoOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all active:scale-95 text-sm"
          >
            <BadgeDollarSign size={18} />
            <span>Pagar Nómina</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs Ejecutivos de Nómina */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Nómina Dispersada</p>
          <h3 className="text-2xl font-black font-mono text-emerald-400 mt-2">
            ${Number(resumen.totalDispersadoHistorico || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{resumen.totalRecibosEmitidos || 0} recibos de pago emitidos</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipo Activo</p>
          <h3 className="text-2xl font-black text-white mt-2">
            {resumen.empleadosActivos || 0} <span className="text-sm font-normal text-slate-400">/ {resumen.totalEmpleados || 0} colaboradores</span>
          </h3>
          <p className="text-xs text-emerald-400 mt-1">Plantilla operativa disponible</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo Semanal Plantilla</p>
          <h3 className="text-2xl font-black font-mono text-indigo-400 mt-2">
            ${Number(resumen.costoSemanalProyectado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Proyección 6 días laborales</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Costo Mensual Estimado</p>
          <h3 className="text-2xl font-black font-mono text-purple-400 mt-2">
            ${Number(resumen.costoMensualProyectado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Presupuesto mensual laboral</p>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('pagos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'pagos'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Receipt size={17} />
          <span>Historial de Pagos de Nómina ({pagos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('empleados')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'empleados'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users size={17} />
          <span>Equipo y Catálogo ({empleados.length})</span>
        </button>
      </div>

      {/* Barra de Filtro y Búsqueda */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder={activeTab === 'pagos' ? 'Buscar por colaborador, período, método...' : 'Buscar colaborador por nombre, puesto o teléfono...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {activeTab === 'pagos' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Filter size={14} className="text-indigo-400" />
              <select
                value={filtroEmpleado}
                onChange={(e) => setFiltroEmpleado(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer text-xs"
              >
                <option value="Todos" className="bg-slate-900">Todos los colaboradores</option>
                {empleados.map(e => (
                  <option key={e.id_empleado} value={e.id_empleado} className="bg-slate-900">
                    {e.nombre} ({e.puesto})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VISTA 1: Historial de Pagos de Nómina */}
      {activeTab === 'pagos' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw size={28} className="animate-spin text-indigo-400" />
              <p className="text-sm">Cargando recibos de nómina...</p>
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <Receipt size={36} className="mx-auto text-slate-600 mb-2" />
              <p className="text-base font-semibold text-slate-300">No hay pagos de nómina registrados</p>
              <p className="text-xs text-slate-500 mt-1">Usa el botón "Pagar Nómina" para registrar la dispersión salarial del equipo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Fecha</th>
                    <th className="py-3.5 px-4 font-semibold">Colaborador</th>
                    <th className="py-3.5 px-4 font-semibold">Período</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Días</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Sueldo / Día</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Bonos / Ded.</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Total Pagado ($)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Forma Pago</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {pagosFiltrados.map((p) => (
                    <tr key={p.id_pago} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {p.fecha_pago}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{p.nombre_empleado}</div>
                        <div className="text-xs text-indigo-400">{p.puesto_empleado}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300 whitespace-nowrap">
                        {p.periodo}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white whitespace-nowrap">
                        {p.dias_trabajados}d
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                        ${parseFloat(p.sueldo_diario).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-xs whitespace-nowrap">
                        <span className="text-emerald-400 font-mono">+${parseFloat(p.bonos).toFixed(2)}</span> /{' '}
                        <span className="text-rose-400 font-mono">-${parseFloat(p.deducciones).toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        ${parseFloat(p.total_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-300 whitespace-nowrap">
                        {p.metodo_pago}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReciboSeleccionado(p);
                              setReciboModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                            title="Ver e Imprimir Recibo Individual"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPagoAEliminar(p);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Anular pago"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: Catálogo del Equipo de Trabajo (Empleados) */}
      {activeTab === 'empleados' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleadosFiltrados.map((emp) => (
            <div key={emp.id_empleado} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base">
                    {emp.nombre.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{emp.nombre}</h3>
                    <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1 mt-0.5">
                      <Briefcase size={12} />
                      {emp.puesto}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  emp.estado === 'Activo'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {emp.estado}
                </span>
              </div>

              <div className="space-y-1.5 py-2 border-y border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Sueldo Diario:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${parseFloat(emp.sueldo_diario).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Teléfono:</span>
                  <span className="text-slate-300 font-mono">{emp.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fecha de Ingreso:</span>
                  <span className="text-slate-300 font-mono">{emp.fecha_ingreso}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => abrirModalEditarEmpleado(emp)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 size={13} />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPagoForm(prev => ({
                      ...prev,
                      id_empleado: emp.id_empleado,
                      sueldo_diario: emp.sueldo_diario
                    }));
                    setModalPagoOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <BadgeDollarSign size={13} />
                  <span>Dispersar Pago</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Pago de Nómina */}
      {modalPagoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 md:p-8 border border-slate-700/80 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Dispersión de Nómina</h3>
                  <p className="text-xs text-slate-400">Cálculo salarial con base en días trabajados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPagoOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearPago} className="space-y-4">
              {/* Seleccionar Colaborador */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Colaborador a Liquidar *
                </label>
                <select
                  required
                  value={pagoForm.id_empleado}
                  onChange={(e) => handleCambioEmpleadoPago(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="" disabled>Selecciona un colaborador...</option>
                  {empleados.map(e => (
                    <option key={e.id_empleado} value={e.id_empleado}>
                      {e.nombre} — {e.puesto} (${parseFloat(e.sueldo_diario).toFixed(2)}/día)
                    </option>
                  ))}
                </select>
              </div>

              {/* Período y Fecha de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Período Liquidado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Semana 45, 1ra Quincena..."
                    value={pagoForm.periodo}
                    onChange={(e) => setPagoForm({ ...pagoForm, periodo: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={pagoForm.fecha_pago}
                    onChange={(e) => setPagoForm({ ...pagoForm, fecha_pago: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Días y Sueldo Diario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Días Laborados *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={pagoForm.dias_trabajados}
                    onChange={(e) => setPagoForm({ ...pagoForm, dias_trabajados: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Sueldo Diario ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pagoForm.sueldo_diario}
                    onChange={(e) => setPagoForm({ ...pagoForm, sueldo_diario: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Bonos y Deducciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bonos / Propinas ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoForm.bonos}
                    onChange={(e) => setPagoForm({ ...pagoForm, bonos: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Deducciones / Faltas ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pagoForm.deducciones}
                    onChange={(e) => setPagoForm({ ...pagoForm, deducciones: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-rose-400 font-mono focus:border-rose-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Forma de Dispersión *
                </label>
                <select
                  value={pagoForm.metodo_pago}
                  onChange={(e) => setPagoForm({ ...pagoForm, metodo_pago: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="Efectivo">Efectivo en Sobre</option>
                  <option value="Transferencia">Transferencia Bancaria (SPEI)</option>
                </select>
              </div>

              {/* Resumen Calculado */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Neto a Liquidar</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ({pagoForm.dias_trabajados}d x ${parseFloat(pagoForm.sueldo_diario || 0).toFixed(2)}) + ${parseFloat(pagoForm.bonos || 0).toFixed(2)} - ${parseFloat(pagoForm.deducciones || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  ${totalPagoCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalPagoOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPago}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
                >
                  {guardandoPago ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Procesando pago...</span>
                    </>
                  ) : (
                    <span>Registrar Pago</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Colaborador */}
      {modalEmpleadoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 md:p-8 border border-slate-700/80 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {modoEdicionEmpleado ? 'Modificar Colaborador' : 'Nuevo Colaborador'}
                  </h3>
                  <p className="text-xs text-slate-400">Ficha laboral del personal de cocina y atención</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEmpleadoOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearEditarEmpleado} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez González"
                  value={empleadoForm.nombre}
                  onChange={(e) => setEmpleadoForm({ ...empleadoForm, nombre: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Puesto / Rol *
                  </label>
                  <select
                    value={empleadoForm.puesto}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, puesto: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                  >
                    <option value="Chef / Cocinero Principal">Chef / Cocinero Principal</option>
                    <option value="Parrillero Especialista">Parrillero Especialista</option>
                    <option value="Cajera y Atención">Cajera y Atención</option>
                    <option value="Mesera / Mesero">Mesera / Mesero</option>
                    <option value="Ayudante de Cocina">Ayudante de Cocina</option>
                    <option value="Lavaloza y Limpieza">Lavaloza y Limpieza</option>
                    <option value="Repartidor">Repartidor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Sueldo Diario ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="350.00"
                    value={empleadoForm.sueldo_diario}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, sueldo_diario: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="55-1234-5678"
                    value={empleadoForm.telefono}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, telefono: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    required
                    value={empleadoForm.fecha_ingreso}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, fecha_ingreso: e.target.value })}
                    className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Estado Operativo
                </label>
                <select
                  value={empleadoForm.estado}
                  onChange={(e) => setEmpleadoForm({ ...empleadoForm, estado: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="Activo">Activo (En nómina)</option>
                  <option value="Inactivo">Inactivo (Suspendido / Baja temporal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Experiencia o Notas
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre habilidades o especialidades..."
                  value={empleadoForm.experiencia_laboral}
                  onChange={(e) => setEmpleadoForm({ ...empleadoForm, experiencia_laboral: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalEmpleadoOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEmpleado}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all text-sm flex items-center gap-2 cursor-pointer"
                >
                  {guardandoEmpleado ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{modoEdicionEmpleado ? 'Actualizar Ficha' : 'Guardar Colaborador'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Recibo de Pago Imprimible Individual */}
      {reciboModalOpen && reciboSeleccionado && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-fade-in flex justify-center items-center p-4 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
          <div
            id="recibo-nomina-imprimible"
            className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700/80 shadow-2xl relative my-auto p-6 md:p-8 flex flex-col print:border-none print:shadow-none print:p-0 print:text-black"
          >
            {/* Cabecera del recibo */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60 print:border-b-2 print:border-black">
              <div>
                <h3 className="text-xl font-black text-white print:text-black tracking-tight flex items-center gap-2">
                  <Receipt size={22} className="text-indigo-400 print:text-black no-print" />
                  Comprobante de Pago de Nómina
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  FoodERP • Gestión Financiera de Negocio de Comida
                </p>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Imprimir comprobante"
                >
                  <Printer size={16} />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReciboModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Datos del Trabajador */}
            <div className="space-y-3 text-xs mb-6">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                <p className="text-slate-400 print:text-gray-600 uppercase text-[10px] font-bold">Colaborador / Empleado</p>
                <h4 className="text-base font-bold text-white print:text-black mt-0.5">{reciboSeleccionado.nombre_empleado}</h4>
                <p className="text-indigo-400 print:text-gray-800 font-semibold">{reciboSeleccionado.puesto_empleado}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-bold">Período</span>
                  <strong className="text-white print:text-black text-sm">{reciboSeleccionado.periodo}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-bold">Fecha de Emisión</span>
                  <strong className="text-white print:text-black text-sm">{reciboSeleccionado.fecha_pago}</strong>
                </div>
              </div>
            </div>

            {/* Desglose de Percepciones y Deducciones */}
            <div className="border border-slate-800 print:border-gray-300 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 print:bg-gray-200 print:text-black uppercase">
                  <tr>
                    <th className="py-2 px-3">Concepto</th>
                    <th className="py-2 px-3 text-center">Base</th>
                    <th className="py-2 px-3 text-right">Monto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-gray-300 print:text-black">
                  <tr>
                    <td className="py-2.5 px-3">Sueldo Base ({reciboSeleccionado.dias_trabajados} días laborados)</td>
                    <td className="py-2.5 px-3 text-center font-mono">${parseFloat(reciboSeleccionado.sueldo_diario).toFixed(2)}/día</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      ${(reciboSeleccionado.dias_trabajados * parseFloat(reciboSeleccionado.sueldo_diario)).toFixed(2)}
                    </td>
                  </tr>
                  {parseFloat(reciboSeleccionado.bonos) > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-emerald-400 print:text-black">Bonos e incentivos de desempeño</td>
                      <td className="py-2 px-3 text-center">—</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400 print:text-black">
                        +${parseFloat(reciboSeleccionado.bonos).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {parseFloat(reciboSeleccionado.deducciones) > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-rose-400 print:text-black">Deducciones / Faltas / Anticipos</td>
                      <td className="py-2 px-3 text-center">—</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-400 print:text-black">
                        -${parseFloat(reciboSeleccionado.deducciones).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-900/90 print:bg-gray-200 border-t border-slate-700 print:border-black font-bold">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-white print:text-black uppercase">
                      Total Neto Pagado ({reciboSeleccionado.metodo_pago})
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 print:text-black text-sm">
                      ${parseFloat(reciboSeleccionado.total_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Líneas de Firma */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-slate-800 print:border-gray-400 text-center text-xs text-slate-400 print:text-black">
              <div>
                <div className="border-t border-slate-600 print:border-black w-3/4 mx-auto mb-1"></div>
                <p className="font-semibold text-slate-300 print:text-black">{reciboSeleccionado.nombre_empleado}</p>
                <p className="text-[10px]">Firma de Conformidad</p>
              </div>
              <div>
                <div className="border-t border-slate-600 print:border-black w-3/4 mx-auto mb-1"></div>
                <p className="font-semibold text-slate-300 print:text-black">Administración / Pagador</p>
                <p className="text-[10px]">Sello y Autorización</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Anulación */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle size={28} />
              <h3 className="text-lg font-bold text-white">¿Anular este recibo de pago?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Estás a punto de anular el pago realizado a{' '}
              <strong className="text-white">{pagoAEliminar?.nombre_empleado}</strong> por{' '}
              <strong className="text-emerald-400 font-mono">${parseFloat(pagoAEliminar?.total_pagado || 0).toFixed(2)}</strong> correspondiente a{' '}
              <strong className="text-indigo-400">{pagoAEliminar?.periodo}</strong>.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPagoAEliminar(null);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAnularPago}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Sí, Anular Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

