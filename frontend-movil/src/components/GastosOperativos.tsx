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

const API_GASTOS = ENDPOINTS.gastosOperativos;

export default function GastosOperativos() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    totalGastos: 0,
    cantidadRegistros: 0,
    promedioGasto: 0,
    desgloseCategorias: {} as Record<string, { cantidad: number; monto: number }>
  });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

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

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
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
        if (data.resumen) setResumen(data.resumen);
      } else {
        showToast(data.message || 'Error al obtener gastos', 'error');
      }
    } catch (err) {
      console.error('Error al cargar gastos:', err);
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

  const abrirModalEditar = (gasto: any) => {
    setModoEdicion(true);
    setIdEditando(gasto.id_gasto);
    setFormData({
      concepto: gasto.concepto,
      categoria: gasto.categoria,
      monto: String(gasto.monto),
      fecha_gasto: gasto.fecha_gasto,
      metodo_pago: gasto.metodo_pago,
      comprobante_referencia: gasto.comprobante_referencia || '',
      notas: gasto.notas || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
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

  const gastosFiltrados = gastos.filter(g => {
    const texto = busqueda.toLowerCase();
    const coincideConcepto = g.concepto.toLowerCase().includes(texto);
    const coincideCategoria = g.categoria.toLowerCase().includes(texto);
    const coincideMetodo = g.metodo_pago.toLowerCase().includes(texto);
    const coincideRef = g.comprobante_referencia ? g.comprobante_referencia.toLowerCase().includes(texto) : false;
    return coincideConcepto || coincideCategoria || coincideMetodo || coincideRef;
  });

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
            <MaterialCommunityIcons name="receipt" size={26} color="#fb7185" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Gastos Operativos</Text>
            <Text style={styles.subtitle}>Servicios, renta, insumos y mantenimiento</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={cargarGastos} disabled={loading}>
            <Feather name="refresh-cw" size={16} color="#94a3b8" />
            <Text style={styles.btnSecondaryText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDanger} onPress={abrirModalCrear}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Registrar Gasto</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#f43f5e' }]}>
            <Text style={styles.kpiLabel}>Total Gastos</Text>
            <Text style={[styles.kpiValue, { color: '#f87171' }]}>
              ${Number(resumen.totalGastos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fca5a5' }]}>Egresos del local</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Comprobantes</Text>
            <Text style={styles.kpiValue}>{resumen.cantidadRegistros}</Text>
            <Text style={styles.kpiSub}>Facturas y recibos</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.kpiLabel}>Gasto Promedio</Text>
            <Text style={styles.kpiValue}>
              ${Number(resumen.promedioGasto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#60a5fa' }]}>Por comprobante</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.kpiLabel}>Mayor Erogación</Text>
            <Text style={[styles.kpiValue, { fontSize: 14, marginTop: 6 }]} numberOfLines={1}>
              {categoriaTop}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fbbf24' }]}>
              ${Number(montoTop).toFixed(2)}
            </Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por concepto, comprobante o notas..."
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

        {/* Categorías Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {['Todas', 'Servicios', 'Renta', 'Mantenimiento', 'Insumos Limpieza', 'Empaques', 'Otros'].map((cat) => {
            const activo = filtroCategoria === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, activo && styles.filterChipActive]}
                onPress={() => setFiltroCategoria(cat)}
              >
                <Text style={[styles.filterChipText, activo && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Listado de Gastos */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando gastos operativos...</Text>
          </View>
        ) : gastosFiltrados.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="file-document-outline" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No se encontraron gastos</Text>
            <Text style={styles.emptySub}>Presiona "+ Registrar Gasto" para agregar recibos.</Text>
          </View>
        ) : (
          gastosFiltrados.map((g) => (
            <View key={g.id_gasto} style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{g.concepto}</Text>
                  <Text style={styles.cardDate}>
                    {g.fecha_gasto} • {g.metodo_pago}
                  </Text>
                </View>

                <View style={styles.badgeCategory}>
                  <Text style={styles.badgeCategoryText}>{g.categoria}</Text>
                </View>
              </View>

              {Boolean(g.comprobante_referencia || g.notas) && (
                <View style={styles.refBox}>
                  {Boolean(g.comprobante_referencia) && (
                    <Text style={styles.refText}>Ref: {g.comprobante_referencia}</Text>
                  )}
                  {Boolean(g.notas) && (
                    <Text style={styles.notesText}>{g.notas}</Text>
                  )}
                </View>
              )}

              <View style={styles.cardBodyRow}>
                <View>
                  <Text style={styles.dataLabel}>Monto del Gasto</Text>
                  <Text style={[styles.dataValue, { color: '#f87171', fontSize: 16 }]}>
                    ${parseFloat(g.monto).toFixed(2)} MXN
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => abrirModalEditar(g)}
                  >
                    <Feather name="edit-2" size={14} color="#818cf8" />
                    <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                    onPress={() => {
                      setGastoAEliminar(g);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#f87171" />
                    <Text style={[styles.cardActionText, { color: '#f87171' }]}>Anular</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Formulario: Registrar / Editar */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modoEdicion ? 'Editar Gasto' : 'Nuevo Gasto Operativo'}
                </Text>
                <Text style={styles.modalSub}>Egresos y facturas del restaurante</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Concepto / Descripción *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. Recibo de Luz CFE, Renta del Local"
                placeholderTextColor="#64748b"
                value={formData.concepto}
                onChangeText={(t) => setFormData({ ...formData, concepto: t })}
              />

              <Text style={styles.formLabel}>Categoría *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Servicios', 'Renta', 'Mantenimiento', 'Insumos Limpieza', 'Empaques', 'Otros'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pillSmall, formData.categoria === c && styles.pillSmallActive]}
                    onPress={() => setFormData({ ...formData, categoria: c })}
                  >
                    <Text style={[styles.pillSmallText, formData.categoria === c && styles.pillSmallTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Monto ($ MXN) *</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={formData.monto}
                    onChangeText={(t) => setFormData({ ...formData, monto: t })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Fecha *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#64748b"
                    value={formData.fecha_gasto}
                    onChangeText={(t) => setFormData({ ...formData, fecha_gasto: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Forma de Pago *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Transferencia', 'Efectivo', 'Tarjeta de Débito', 'Tarjeta de Crédito'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pillSmall, formData.metodo_pago === m && styles.pillSmallActive]}
                    onPress={() => setFormData({ ...formData, metodo_pago: m })}
                  >
                    <Text style={[styles.pillSmallText, formData.metodo_pago === m && styles.pillSmallTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Folio / Comprobante / Factura</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. FAC-CFE-0023, Ticket #441"
                placeholderTextColor="#64748b"
                value={formData.comprobante_referencia}
                onChangeText={(t) => setFormData({ ...formData, comprobante_referencia: t })}
              />

              <Text style={styles.formLabel}>Notas u Observaciones</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Observaciones adicionales..."
                placeholderTextColor="#64748b"
                multiline
                value={formData.notas}
                onChangeText={(t) => setFormData({ ...formData, notas: t })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalOpen(false)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnDanger, guardando && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {modoEdicion ? 'Actualizar' : 'Guardar Gasto'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmación de Cancelación */}
      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={styles.deleteIconWrap}>
              <Feather name="trash-2" size={28} color="#f43f5e" />
            </View>
            <Text style={styles.modalTitle}>¿Anular Gasto?</Text>
            <Text style={styles.deleteDesc}>
              Se eliminará el registro de "{gastoAEliminar?.concepto}" por ${parseFloat(gastoAEliminar?.monto || '0').toFixed(2)}. Esta acción no se puede deshacer.
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
                onPress={confirmarEliminar}
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
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  headerActions: { flexDirection: 'row', gap: 10 },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e11d48',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10
  },
  btnSecondaryText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  kpisScroll: { marginBottom: 14 },
  kpiCard: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderLeftWidth: 4,
    borderRadius: 12, padding: 12, marginRight: 10, minWidth: 135
  },
  kpiLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  kpiValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  kpiSub: { color: '#64748b', fontSize: 10 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderWidth: 1,
    borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  filtersScroll: { marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', marginRight: 8 },
  filterChipActive: { backgroundColor: '#e11d48' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  emptyTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 8 },
  emptySub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardItem: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14,
    padding: 14, marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cardDate: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  badgeCategory: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeCategoryText: { color: '#fb7185', fontSize: 11, fontWeight: 'bold' },
  refBox: { backgroundColor: '#0f172a', padding: 8, borderRadius: 8, marginBottom: 8 },
  refText: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
  notesText: { color: '#cbd5e1', fontSize: 11, marginTop: 2 },
  cardBodyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#0f172a', borderRadius: 10, padding: 10
  },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
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
  pillSmallActive: { backgroundColor: '#e11d48', borderColor: '#e11d48' },
  pillSmallText: { color: '#94a3b8', fontSize: 11 },
  pillSmallTextActive: { color: '#ffffff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

