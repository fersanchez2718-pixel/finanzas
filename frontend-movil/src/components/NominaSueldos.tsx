import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../config/api';

const API_NOMINA = ENDPOINTS.nomina;

export default function NominaSueldos() {
  const [activeTab, setActiveTab] = useState<'pagos' | 'empleados'>('pagos');
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
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
  const [idEmpleadoEditando, setIdEmpleadoEditando] = useState<number | null>(null);
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);

  // Modal Recibo
  const [reciboModalOpen, setReciboModalOpen] = useState(false);
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);

  // Modal Eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pagoAEliminar, setPagoAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const hoy = new Date().toISOString().split('T')[0];

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

  const [empleadoForm, setEmpleadoForm] = useState({
    nombre: '',
    puesto: 'Cocinero',
    telefono: '',
    sueldo_diario: '',
    fecha_ingreso: hoy,
    estado: 'Activo',
    experiencia_laboral: ''
  });

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
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
            id_empleado: String(primerEmp.id_empleado),
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
      showToast('Error al cargar nómina', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCambioEmpleadoPago = (id: string) => {
    const emp = empleados.find(e => String(e.id_empleado) === String(id));
    setPagoForm(prev => ({
      ...prev,
      id_empleado: id,
      sueldo_diario: emp ? emp.sueldo_diario : prev.sueldo_diario
    }));
  };

  const subtotalPago = (parseInt(String(pagoForm.dias_trabajados) || '0', 10)) * parseFloat(String(pagoForm.sueldo_diario) || '0');
  const totalPagoCalculado = Math.max(0, subtotalPago + parseFloat(String(pagoForm.bonos) || '0') - parseFloat(String(pagoForm.deducciones) || '0'));

  const handleCrearPago = async () => {
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

  const handleCrearEditarEmpleado = async () => {
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

  const abrirModalEditarEmpleado = (emp: any) => {
    setModoEdicionEmpleado(true);
    setIdEmpleadoEditando(emp.id_empleado);
    setEmpleadoForm({
      nombre: emp.nombre,
      puesto: emp.puesto,
      telefono: emp.telefono || '',
      sueldo_diario: String(emp.sueldo_diario),
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

  const pagosFiltrados = pagos.filter(p => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = p.nombre_empleado.toLowerCase().includes(texto) ||
      p.puesto_empleado.toLowerCase().includes(texto) ||
      p.periodo.toLowerCase().includes(texto) ||
      p.metodo_pago.toLowerCase().includes(texto);
    const coincideEmpleado = filtroEmpleado === 'Todos' || String(p.id_empleado) === String(filtroEmpleado);
    return coincideTexto && coincideEmpleado;
  });

  const empleadosFiltrados = empleados.filter(e => {
    const texto = busqueda.toLowerCase();
    return e.nombre.toLowerCase().includes(texto) ||
      e.puesto.toLowerCase().includes(texto) ||
      (e.telefono && e.telefono.includes(texto));
  });

  return (
    <View style={styles.container}>
      {toast && (
        <View style={[styles.toast, toast.tipo === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Feather name={toast.tipo === 'success' ? 'check-circle' : 'alert-triangle'} size={18} color="#fff" />
          <Text style={styles.toastText}>{toast.mensaje}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="account-group" size={26} color="#818cf8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Nómina y Sueldos</Text>
            <Text style={styles.subtitle}>Colaboradores, cálculo y dispersión</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={abrirModalCrearEmpleado}>
            <Feather name="user-plus" size={15} color="#818cf8" />
            <Text style={styles.btnSecondaryText}>+ Colaborador</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => setModalPagoOpen(true)}>
            <Feather name="dollar-sign" size={15} color="#fff" />
            <Text style={styles.btnPrimaryText}>Pagar Nómina</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Plantilla</Text>
            <Text style={styles.kpiValue}>{resumen.totalEmpleados} ({resumen.empleadosActivos} activos)</Text>
            <Text style={styles.kpiSub}>Colaboradores</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.kpiLabel}>Costo Diario</Text>
            <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>
              ${Number(resumen.costoDiarioPlantilla).toFixed(2)}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fde68a' }]}>Nómina por día</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.kpiLabel}>Semanal Est.</Text>
            <Text style={[styles.kpiValue, { color: '#60a5fa' }]}>
              ${Number(resumen.costoSemanalProyectado).toFixed(2)}
            </Text>
            <Text style={[styles.kpiSub, { color: '#93c5fd' }]}>Proyección 6 días</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Dispersado Histórico</Text>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>
              ${Number(resumen.totalDispersadoHistorico).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#a7f3d0' }]}>Total acumulado</Text>
          </View>
        </ScrollView>

        {/* Pestañas Pagos / Empleados */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pagos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pagos')}
          >
            <Feather name="file-text" size={15} color={activeTab === 'pagos' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.tabBtnText, activeTab === 'pagos' && styles.tabBtnTextActive]}>
              Pagos de Nómina ({pagos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'empleados' && styles.tabBtnActive]}
            onPress={() => setActiveTab('empleados')}
          >
            <Feather name="users" size={15} color={activeTab === 'empleados' ? '#fff' : '#94a3b8'} />
            <Text style={[styles.tabBtnText, activeTab === 'empleados' && styles.tabBtnTextActive]}>
              Colaboradores ({empleados.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por colaborador, puesto o periodo..."
            placeholderTextColor="#64748b"
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.searchInput}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Feather name="x" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Contenido según Tab */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando nómina...</Text>
          </View>
        ) : activeTab === 'pagos' ? (
          pagosFiltrados.length === 0 ? (
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="cash-remove" size={44} color="#475569" />
              <Text style={styles.emptyTitle}>No hay recibos de pago</Text>
              <Text style={styles.emptySub}>Presiona "Pagar Nómina" para registrar una dispersión.</Text>
            </View>
          ) : (
            pagosFiltrados.map((p) => (
              <View key={p.id_pago} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{p.nombre_empleado}</Text>
                    <Text style={styles.cardDate}>
                      {p.puesto_empleado} • Periodo: {p.periodo}
                    </Text>
                  </View>

                  <View style={styles.badgeSuccess}>
                    <Text style={styles.badgeTextSuccess}>{p.metodo_pago}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Días</Text>
                    <Text style={styles.dataValue}>{p.dias_trabajados}d</Text>
                  </View>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Sueldo/Día</Text>
                    <Text style={styles.dataValue}>${parseFloat(p.sueldo_diario).toFixed(2)}</Text>
                  </View>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Total Pagado</Text>
                    <Text style={[styles.dataValue, { color: '#34d399', fontSize: 14 }]}>
                      ${parseFloat(p.total_pagado).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => {
                      setReciboSeleccionado(p);
                      setReciboModalOpen(true);
                    }}
                  >
                    <Feather name="eye" size={14} color="#818cf8" />
                    <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Ver Recibo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                    onPress={() => {
                      setPagoAEliminar(p);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#f87171" />
                    <Text style={[styles.cardActionText, { color: '#f87171' }]}>Anular</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          empleadosFiltrados.length === 0 ? (
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="account-off-outline" size={44} color="#475569" />
              <Text style={styles.emptyTitle}>No hay colaboradores registrados</Text>
              <Text style={styles.emptySub}>Presiona "+ Colaborador" para registrar a tu equipo.</Text>
            </View>
          ) : (
            empleadosFiltrados.map((emp) => (
              <View key={emp.id_empleado} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{emp.nombre}</Text>
                    <Text style={styles.cardDate}>
                      {emp.puesto} • {emp.telefono || 'Sin teléfono'}
                    </Text>
                  </View>

                  <View style={emp.estado === 'Activo' ? styles.badgeSuccess : styles.badgeWarning}>
                    <Text style={emp.estado === 'Activo' ? styles.badgeTextSuccess : styles.badgeTextWarning}>
                      {emp.estado}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Sueldo Diario</Text>
                    <Text style={[styles.dataValue, { color: '#34d399' }]}>
                      ${parseFloat(emp.sueldo_diario).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Ingreso</Text>
                    <Text style={styles.dataValue}>{emp.fecha_ingreso}</Text>
                  </View>

                  <View style={[styles.dataCol, { flex: 1.5, alignItems: 'flex-start' }]}>
                    <Text style={styles.dataLabel}>Experiencia</Text>
                    <Text style={[styles.dataValue, { fontSize: 11, color: '#cbd5e1' }]} numberOfLines={1}>
                      {emp.experiencia_laboral || 'General'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => abrirModalEditarEmpleado(emp)}
                  >
                    <Feather name="edit-2" size={14} color="#818cf8" />
                    <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Editar Ficha</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Pagar Nómina */}
      <Modal visible={modalPagoOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispersión de Nómina</Text>
                <Text style={styles.modalSub}>Calcular y registrar pago a colaborador</Text>
              </View>
              <TouchableOpacity onPress={() => setModalPagoOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Colaborador *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {empleados.map((e) => {
                  const sel = String(pagoForm.id_empleado) === String(e.id_empleado);
                  return (
                    <TouchableOpacity
                      key={e.id_empleado}
                      style={[styles.pillSmall, sel && styles.pillSmallActive]}
                      onPress={() => handleCambioEmpleadoPago(String(e.id_empleado))}
                    >
                      <Text style={[styles.pillSmallText, sel && styles.pillSmallTextActive]}>
                        {e.nombre} (${e.sueldo_diario}/día)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Fecha de Pago *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pagoForm.fecha_pago}
                    onChangeText={(t) => setPagoForm({ ...pagoForm, fecha_pago: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Periodo *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={pagoForm.periodo}
                    onChangeText={(t) => setPagoForm({ ...pagoForm, periodo: t })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Días Trabajados *</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(pagoForm.dias_trabajados)}
                    onChangeText={(t) => setPagoForm({ ...pagoForm, dias_trabajados: parseInt(t, 10) || 0 })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Sueldo Diario ($)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(pagoForm.sueldo_diario)}
                    onChangeText={(t) => setPagoForm({ ...pagoForm, sueldo_diario: parseFloat(t) || 0 })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Bonos ($)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(pagoForm.bonos)}
                    onChangeText={(t) => setPagoForm({ ...pagoForm, bonos: parseFloat(t) || 0 })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Deducciones ($)</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(pagoForm.deducciones)}
                    onChangeText={(t) => setPagoForm({ ...pagoForm, deducciones: parseFloat(t) || 0 })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Forma de Pago *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Efectivo', 'Transferencia', 'Tarjeta de Débito'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pillSmall, pagoForm.metodo_pago === m && styles.pillSmallActive]}
                    onPress={() => setPagoForm({ ...pagoForm, metodo_pago: m })}
                  >
                    <Text style={[styles.pillSmallText, pagoForm.metodo_pago === m && styles.pillSmallTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Total en vivo */}
              <View style={styles.totalBox}>
                <Text style={styles.totalBoxLabel}>Total a Pagar:</Text>
                <Text style={styles.totalBoxValue}>${totalPagoCalculado.toFixed(2)} MXN</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalPagoOpen(false)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, guardandoPago && { opacity: 0.7 }]}
                  onPress={handleCrearPago}
                  disabled={guardandoPago}
                >
                  {guardandoPago ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Registrar Pago</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Crear / Editar Empleado */}
      <Modal visible={modalEmpleadoOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modoEdicionEmpleado ? 'Editar Colaborador' : 'Nuevo Colaborador'}
                </Text>
                <Text style={styles.modalSub}>Ficha del miembro de equipo</Text>
              </View>
              <TouchableOpacity onPress={() => setModalEmpleadoOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. Carlos Mendoza"
                placeholderTextColor="#64748b"
                value={empleadoForm.nombre}
                onChangeText={(t) => setEmpleadoForm({ ...empleadoForm, nombre: t })}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Puesto / Rol *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="ej. Chef, Mesero, Cajero"
                    placeholderTextColor="#64748b"
                    value={empleadoForm.puesto}
                    onChangeText={(t) => setEmpleadoForm({ ...empleadoForm, puesto: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="55-0000-0000"
                    placeholderTextColor="#64748b"
                    value={empleadoForm.telefono}
                    onChangeText={(t) => setEmpleadoForm({ ...empleadoForm, telefono: t })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Sueldo Diario ($) *</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={empleadoForm.sueldo_diario}
                    onChangeText={(t) => setEmpleadoForm({ ...empleadoForm, sueldo_diario: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Fecha de Ingreso *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={empleadoForm.fecha_ingreso}
                    onChangeText={(t) => setEmpleadoForm({ ...empleadoForm, fecha_ingreso: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Estado</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {['Activo', 'Inactivo'].map((est) => (
                  <TouchableOpacity
                    key={est}
                    style={[styles.pillSmall, empleadoForm.estado === est && styles.pillSmallActive]}
                    onPress={() => setEmpleadoForm({ ...empleadoForm, estado: est })}
                  >
                    <Text style={[styles.pillSmallText, empleadoForm.estado === est && styles.pillSmallTextActive]}>
                      {est}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Experiencia Laboral</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Antecedentes o especialidad..."
                placeholderTextColor="#64748b"
                multiline
                value={empleadoForm.experiencia_laboral}
                onChangeText={(t) => setEmpleadoForm({ ...empleadoForm, experiencia_laboral: t })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalEmpleadoOpen(false)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, guardandoEmpleado && { opacity: 0.7 }]}
                  onPress={handleCrearEditarEmpleado}
                  disabled={guardandoEmpleado}
                >
                  {guardandoEmpleado ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {modoEdicionEmpleado ? 'Actualizar Ficha' : 'Guardar Colaborador'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Ver Recibo Individual */}
      <Modal visible={reciboModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Recibo de Pago de Nómina</Text>
                <Text style={styles.modalSub}>Folio #{reciboSeleccionado?.id_pago}</Text>
              </View>
              <TouchableOpacity onPress={() => setReciboModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {reciboSeleccionado && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.reciboBox}>
                  <Text style={styles.reciboEmpName}>{reciboSeleccionado.nombre_empleado}</Text>
                  <Text style={styles.reciboEmpRole}>{reciboSeleccionado.puesto_empleado}</Text>

                  <View style={styles.reciboDivider} />

                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Fecha de Pago:</Text>
                    <Text style={styles.reciboVal}>{reciboSeleccionado.fecha_pago}</Text>
                  </View>
                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Periodo:</Text>
                    <Text style={styles.reciboVal}>{reciboSeleccionado.periodo}</Text>
                  </View>
                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Días Laborados:</Text>
                    <Text style={styles.reciboVal}>{reciboSeleccionado.dias_trabajados} días</Text>
                  </View>
                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Sueldo Diario:</Text>
                    <Text style={styles.reciboVal}>${parseFloat(reciboSeleccionado.sueldo_diario).toFixed(2)}</Text>
                  </View>
                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Bonos / Incentivos:</Text>
                    <Text style={[styles.reciboVal, { color: '#34d399' }]}>+${parseFloat(reciboSeleccionado.bonos || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Deducciones:</Text>
                    <Text style={[styles.reciboVal, { color: '#f87171' }]}>-${parseFloat(reciboSeleccionado.deducciones || 0).toFixed(2)}</Text>
                  </View>

                  <View style={styles.reciboDivider} />

                  <View style={styles.reciboRow}>
                    <Text style={[styles.reciboLabel, { fontWeight: 'bold', color: '#fff' }]}>Total Neto Pagado:</Text>
                    <Text style={[styles.reciboVal, { fontWeight: 'bold', fontSize: 16, color: '#34d399' }]}>
                      ${parseFloat(reciboSeleccionado.total_pagado).toFixed(2)} MXN
                    </Text>
                  </View>
                  <View style={styles.reciboRow}>
                    <Text style={styles.reciboLabel}>Método de Pago:</Text>
                    <Text style={styles.reciboVal}>{reciboSeleccionado.metodo_pago}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.btnPrimary, { width: '100%', justifyContent: 'center' }]}
                    onPress={() => setReciboModalOpen(false)}
                  >
                    <Text style={styles.btnPrimaryText}>Cerrar Recibo</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Cancelación */}
      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={styles.deleteIconWrap}>
              <Feather name="trash-2" size={28} color="#f43f5e" />
            </View>
            <Text style={styles.modalTitle}>¿Anular Pago?</Text>
            <Text style={styles.deleteDesc}>
              Se anulará el recibo de nómina de {pagoAEliminar?.nombre_empleado} por ${parseFloat(pagoAEliminar?.total_pagado || '0').toFixed(2)}.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                style={[styles.btnSecondary, { flex: 1, justifyContent: 'center' }]}
                onPress={() => setDeleteModalOpen(false)}
              >
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnDanger, { flex: 1, justifyContent: 'center' }]}
                onPress={confirmarAnularPago}
              >
                <Text style={styles.btnPrimaryText}>Sí, Anular</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 16, paddingTop: 12 },
  toast: {
    position: 'absolute', top: 10, left: 16, right: 16, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, elevation: 8
  },
  toastSuccess: { backgroundColor: '#059669' },
  toastError: { backgroundColor: '#e11d48' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 13, flex: 1 },
  header: { marginBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIconContainer: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  headerActions: { flexDirection: 'row', gap: 10 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366f1',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10
  },
  btnSecondaryText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  btnDanger: { backgroundColor: '#e11d48', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  kpisScroll: { marginBottom: 14 },
  kpiCard: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderLeftWidth: 4,
    borderRadius: 12, padding: 12, marginRight: 10, minWidth: 135
  },
  kpiLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  kpiValue: { color: '#ffffff', fontSize: 17, fontWeight: 'bold', marginVertical: 4 },
  kpiSub: { color: '#64748b', fontSize: 10 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: '#334155', marginBottom: 12
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8
  },
  tabBtnActive: { backgroundColor: '#6366f1' },
  tabBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  tabBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1,
    borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 12
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  emptyTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 8 },
  emptySub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardItem: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14,
    padding: 14, marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cardDate: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeTextSuccess: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeTextWarning: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a',
    borderRadius: 10, padding: 10, marginBottom: 10
  },
  dataCol: { alignItems: 'center' },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cardActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#334155', backgroundColor: '#1e293b'
  },
  cardActionText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxHeight: '90%', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12, marginBottom: 14 },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  formLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 8 },
  formInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  pillSmall: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  pillSmallActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  pillSmallText: { color: '#94a3b8', fontSize: 11 },
  pillSmallTextActive: { color: '#ffffff', fontWeight: 'bold' },
  totalBox: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: 14, marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalBoxLabel: { color: '#a7f3d0', fontSize: 13, fontWeight: 'bold' },
  totalBoxValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  reciboBox: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 14 },
  reciboEmpName: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  reciboEmpRole: { color: '#818cf8', fontSize: 13, marginTop: 2 },
  reciboDivider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  reciboRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  reciboLabel: { color: '#94a3b8', fontSize: 12 },
  reciboVal: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

