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

const API_MERMAS = ENDPOINTS.mermas;
const API_MATERIA_PRIMA = ENDPOINTS.materiaPrima;

export default function ControlMermas() {
  const [mermas, setMermas] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    totalIncidentes: 0,
    perdidaTotal: 0,
    insumoMasMermado: 'Ninguno'
  });
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');

  // Modal Registrar Merma
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    id_materia_prima: '',
    fecha: hoy,
    cantidad_desperdiciada: '',
    motivo: 'Merma de preparación o corte'
  });

  // Modal Cancelar Merma
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mermaAEliminar, setMermaAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarMermas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_MERMAS);
      const data = await res.json();
      if (data.success) {
        setMermas(data.data || []);
        if (data.resumen) setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al obtener mermas');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumos = async () => {
    try {
      const res = await fetch(API_MATERIA_PRIMA);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setInsumosDisponibles(data.data);
        if (!formData.id_materia_prima) {
          setFormData(prev => ({ ...prev, id_materia_prima: String(data.data[0].id_materia_prima) }));
        }
      }
    } catch (err) {
      console.error('Error al cargar insumos:', err);
    }
  };

  useEffect(() => {
    cargarMermas();
    cargarInsumos();
  }, []);

  const abrirModalCrear = () => {
    setFormData({
      id_materia_prima: insumosDisponibles.length > 0 ? String(insumosDisponibles[0].id_materia_prima) : '',
      fecha: hoy,
      cantidad_desperdiciada: '',
      motivo: 'Merma de preparación o corte'
    });
    setModalOpen(true);
  };

  const insumoSeleccionado = insumosDisponibles.find(
    i => String(i.id_materia_prima) === String(formData.id_materia_prima)
  );

  const handleCrearSubmit = async () => {
    if (!formData.id_materia_prima || !formData.fecha || formData.cantidad_desperdiciada === '') {
      showToast('Por favor completa los campos requeridos', 'error');
      return;
    }

    const cantNum = parseFloat(formData.cantidad_desperdiciada);
    if (isNaN(cantNum) || cantNum <= 0) {
      showToast('Ingresa una cantidad mayor a cero', 'error');
      return;
    }

    if (insumoSeleccionado && cantNum > parseFloat(insumoSeleccionado.cantidad_disponible)) {
      showToast(`La merma no puede superar el stock actual (${insumoSeleccionado.cantidad_disponible} ${insumoSeleccionado.unidad_medida})`, 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(API_MERMAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_materia_prima: formData.id_materia_prima,
          fecha: formData.fecha,
          cantidad_desperdiciada: cantNum,
          motivo: formData.motivo
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Merma registrada y stock actualizado');
        setModalOpen(false);
        cargarMermas();
        cargarInsumos();
      } else {
        showToast(resData.message || 'Error al registrar merma', 'error');
      }
    } catch (err) {
      console.error('Error al registrar merma:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!mermaAEliminar) return;
    try {
      const res = await fetch(`${API_MERMAS}/${mermaAEliminar.id_desperdicio}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('Merma cancelada y stock reintegrado al inventario');
        setDeleteModalOpen(false);
        setMermaAEliminar(null);
        cargarMermas();
        cargarInsumos();
      } else {
        showToast(resData.message || 'Error al cancelar merma', 'error');
      }
    } catch (err) {
      console.error('Error al anular merma:', err);
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  const mermasFiltradas = mermas.filter(item =>
    item.nombre_materia_prima.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.motivo.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.fecha.includes(busqueda)
  );

  return (
    <View style={styles.container}>
      {toast && (
        <View style={[styles.toast, toast.tipo === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Feather
            name={toast.tipo === 'success' ? 'check-circle' : 'alert-triangle'}
            size={18}
            color="#fff"
          />
          <Text style={styles.toastText}>{toast.mensaje}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="trash-can-outline" size={26} color="#f43f5e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Control de Mermas</Text>
            <Text style={styles.subtitle}>Desperdicios y pérdidas económicas</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={cargarMermas}
            disabled={loading}
          >
            <Feather name="refresh-cw" size={16} color="#94a3b8" />
            <Text style={styles.btnSecondaryText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnDanger} onPress={abrirModalCrear}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Registrar Merma</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#f43f5e' }]}>
            <Text style={styles.kpiLabel}>Pérdida Total</Text>
            <Text style={[styles.kpiValue, { color: '#f87171' }]}>
              ${Number(resumen.perdidaTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fca5a5' }]}>Pérdida monetaria</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.kpiLabel}>Más Desperdiciado</Text>
            <Text style={[styles.kpiValue, { fontSize: 14, marginTop: 6 }]} numberOfLines={1}>
              {resumen.insumoMasMermado}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fbbf24' }]}>Mayor volumen</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Incidentes</Text>
            <Text style={styles.kpiValue}>{resumen.totalIncidentes}</Text>
            <Text style={styles.kpiSub}>Eventos reportados</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por insumo, causa o fecha..."
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

        {/* Listado de Mermas */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando control de mermas...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={44} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={cargarMermas}>
              <Text style={styles.btnRetryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : mermasFiltradas.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="delete-empty" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No hay mermas registradas</Text>
            <Text style={styles.emptySub}>Presiona "+ Registrar Merma" para reportar desperdicios.</Text>
          </View>
        ) : (
          mermasFiltradas.map((item, idx) => {
            const cantNum = parseFloat(item.cantidad_desperdiciada);
            const costoPerdida = parseFloat(item.costo_perdida || 0);

            return (
              <View key={item.id_desperdicio || idx} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.nombre_materia_prima}</Text>
                    <Text style={styles.cardDate}>Fecha: {item.fecha}</Text>
                  </View>

                  <View style={styles.badgeMerma}>
                    <Feather name="pie-chart" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                    <Text style={styles.badgeMermaText}>
                      {parseFloat(item.porcentaje_desperdicio).toFixed(1)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Desperdicio</Text>
                    <Text style={[styles.dataValue, { color: '#f87171' }]}>
                      -{cantNum.toFixed(2)} {item.unidad_medida}
                    </Text>
                  </View>

                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Pérdida $</Text>
                    <Text style={[styles.dataValue, { color: '#f87171' }]}>
                      ${costoPerdida.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.dataCol, { flex: 1.5, alignItems: 'flex-start', paddingLeft: 10 }]}>
                    <Text style={styles.dataLabel}>Motivo</Text>
                    <Text style={[styles.dataValue, { fontSize: 11, color: '#cbd5e1' }]} numberOfLines={2}>
                      {item.motivo}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={() => {
                      setMermaAEliminar(item);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="rotate-ccw" size={13} color="#f87171" />
                    <Text style={styles.btnDeleteText}>Anular y Reintegrar Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Registrar Merma */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar Merma o Pérdida</Text>
                <Text style={styles.modalSub}>Descuenta automáticamente del inventario</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Insumo Afectado *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {insumosDisponibles.map((i) => {
                  const sel = String(formData.id_materia_prima) === String(i.id_materia_prima);
                  return (
                    <TouchableOpacity
                      key={i.id_materia_prima}
                      style={[styles.insumoPill, sel && styles.insumoPillActive]}
                      onPress={() => setFormData({ ...formData, id_materia_prima: String(i.id_materia_prima) })}
                    >
                      <Text style={[styles.insumoPillText, sel && styles.insumoPillTextActive]}>
                        {i.nombre} ({parseFloat(i.cantidad_disponible).toFixed(1)} {i.unidad_medida})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Fecha *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#64748b"
                    value={formData.fecha}
                    onChangeText={(t) => setFormData({ ...formData, fecha: t })}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>
                    Cantidad ({insumoSeleccionado?.unidad_medida || 'U'}) *
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={formData.cantidad_desperdiciada}
                    onChangeText={(t) => setFormData({ ...formData, cantidad_desperdiciada: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Causa / Motivo del Desperdicio *</Text>
              <View style={styles.motivosList}>
                {[
                  'Merma de preparación o corte',
                  'Caducidad de insumo',
                  'Accidente o caída en cocina',
                  'Falla en refrigeración',
                  'Devolución por mala calidad'
                ].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.motivoChip, formData.motivo === m && styles.motivoChipActive]}
                    onPress={() => setFormData({ ...formData, motivo: m })}
                  >
                    <Text style={[styles.motivoChipText, formData.motivo === m && styles.motivoChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {Boolean(insumoSeleccionado && formData.cantidad_desperdiciada && Number(formData.cantidad_desperdiciada) > 0) && (
                <View style={styles.estimateBox}>
                  <Text style={styles.estimateLabel}>Pérdida Económica Estimada:</Text>
                  <Text style={[styles.estimateValue, { color: '#f87171' }]}>
                    ${(Number(formData.cantidad_desperdiciada) * parseFloat(insumoSeleccionado.costo_unitario)).toFixed(2)} MXN
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setModalOpen(false)}
                >
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnDanger, guardando && { opacity: 0.7 }]}
                  onPress={handleCrearSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Registrar Merma</Text>
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
              <Feather name="rotate-ccw" size={28} color="#f43f5e" />
            </View>
            <Text style={styles.modalTitle}>¿Anular Merma?</Text>
            <Text style={styles.deleteDesc}>
              Se anulará el registro de desperdicio de "{mermaAEliminar?.nombre_materia_prima}".
              {'\n\n'}
              <Text style={{ color: '#34d399', fontWeight: 'bold' }}>
                Se reintegrarán {mermaAEliminar?.cantidad_desperdiciada} {mermaAEliminar?.unidad_medida} al inventario disponible.
              </Text>
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
                <Text style={styles.btnPrimaryText}>Sí, Reintegrar</Text>
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
    borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 12
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  btnRetry: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnRetryText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 8 },
  emptySub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardItem: {
    backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 14,
    padding: 14, marginBottom: 12
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cardDate: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  badgeMerma: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeMermaText: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a',
    borderRadius: 10, padding: 10, marginBottom: 10
  },
  dataCol: { alignItems: 'center' },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  btnDelete: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(244, 63, 94, 0.1)'
  },
  btnDeleteText: { color: '#f87171', fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxHeight: '90%', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 12, marginBottom: 14 },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  formLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 8 },
  formInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  insumoPill: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginRight: 8 },
  insumoPillActive: { backgroundColor: '#e11d48', borderColor: '#e11d48' },
  insumoPillText: { color: '#94a3b8', fontSize: 12 },
  insumoPillTextActive: { color: '#ffffff', fontWeight: 'bold' },
  motivosList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  motivoChip: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  motivoChipActive: { backgroundColor: '#e11d48', borderColor: '#e11d48' },
  motivoChipText: { color: '#94a3b8', fontSize: 11 },
  motivoChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  estimateBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estimateLabel: { color: '#94a3b8', fontSize: 12 },
  estimateValue: { fontWeight: 'bold', fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

