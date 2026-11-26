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

const API_COMPRAS = ENDPOINTS.compras;
const API_MATERIA_PRIMA = ENDPOINTS.materiaPrima;

export default function RegistroCompras() {
  const [compras, setCompras] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    totalCompras: 0,
    gastoTotal: 0,
    compraPromedio: 0,
    ultimaCompra: null
  });
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');

  // Modal Nueva Compra
  const [modalOpen, setModalOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    id_materia_prima: '',
    fecha_compra: hoy,
    cantidad: '',
    costo_total: ''
  });

  // Modal Eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [compraAEliminar, setCompraAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarCompras = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_COMPRAS);
      const data = await res.json();
      if (data.success) {
        setCompras(data.data || []);
        if (data.resumen) setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al obtener compras');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumosParaCompras = async () => {
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
      console.error('Error al cargar insumos para compras:', err);
    }
  };

  useEffect(() => {
    cargarCompras();
    cargarInsumosParaCompras();
  }, []);

  const abrirModalCrear = () => {
    setFormData({
      id_materia_prima: insumosDisponibles.length > 0 ? String(insumosDisponibles[0].id_materia_prima) : '',
      fecha_compra: hoy,
      cantidad: '',
      costo_total: ''
    });
    setModalOpen(true);
  };

  const insumoSeleccionado = insumosDisponibles.find(
    i => String(i.id_materia_prima) === String(formData.id_materia_prima)
  );

  const handleCrearSubmit = async () => {
    if (!formData.id_materia_prima || !formData.fecha_compra || formData.cantidad === '' || formData.costo_total === '') {
      showToast('Por favor completa todos los campos', 'error');
      return;
    }

    const cantNum = parseFloat(formData.cantidad);
    const costoNum = parseFloat(formData.costo_total);

    if (isNaN(cantNum) || cantNum <= 0 || isNaN(costoNum) || costoNum < 0) {
      showToast('La cantidad debe ser mayor a cero y el costo total válido', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(API_COMPRAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_materia_prima: formData.id_materia_prima,
          fecha_compra: formData.fecha_compra,
          cantidad: cantNum,
          costo_total: costoNum
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Compra registrada y stock actualizado');
        setModalOpen(false);
        cargarCompras();
        cargarInsumosParaCompras();
      } else {
        showToast(resData.message || 'Error al registrar compra', 'error');
      }
    } catch (err) {
      console.error('Error al crear compra:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!compraAEliminar) return;
    try {
      const res = await fetch(`${API_COMPRAS}/${compraAEliminar.id_compra}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        showToast('Compra cancelada y stock revertido en inventario');
        setDeleteModalOpen(false);
        setCompraAEliminar(null);
        cargarCompras();
        cargarInsumosParaCompras();
      } else {
        showToast(resData.message || 'Error al eliminar', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar compra:', err);
      showToast('Error de conexión con el servidor', 'error');
    }
  };

  const comprasFiltradas = compras.filter(item =>
    item.nombre_materia_prima.toLowerCase().includes(busqueda.toLowerCase())
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
            <MaterialCommunityIcons name="cart-outline" size={26} color="#3b82f6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Registro de Compras</Text>
            <Text style={styles.subtitle}>Abastecimiento de insumos y stock</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={cargarCompras}
            disabled={loading}
          >
            <Feather name="refresh-cw" size={16} color="#94a3b8" />
            <Text style={styles.btnSecondaryText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={abrirModalCrear}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Nueva Compra</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Inversión Compras</Text>
            <Text style={styles.kpiValue}>
              ${Number(resumen.gastoTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#34d399' }]}>Gasto acumulado</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Órdenes Hechas</Text>
            <Text style={styles.kpiValue}>{resumen.totalCompras}</Text>
            <Text style={styles.kpiSub}>Registros</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.kpiLabel}>Ticket Medio</Text>
            <Text style={styles.kpiValue}>
              ${Number(resumen.compraPromedio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#60a5fa' }]}>Por compra</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f97316' }]}>
            <Text style={styles.kpiLabel}>Última Compra</Text>
            <Text style={[styles.kpiValue, { fontSize: 14, marginTop: 6 }]}>
              {resumen.ultimaCompra ? String(resumen.ultimaCompra) : 'Sin registros'}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fb923c' }]}>Más reciente</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por insumo comprado..."
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

        {/* Listado de Compras */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando historial de compras...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={44} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={cargarCompras}>
              <Text style={styles.btnRetryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : comprasFiltradas.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="cart-off" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No hay compras registradas</Text>
            <Text style={styles.emptySub}>Presiona "+ Nueva Compra" para abastecer stock.</Text>
          </View>
        ) : (
          comprasFiltradas.map((item) => {
            const cantNum = parseFloat(item.cantidad);
            const costoNum = parseFloat(item.costo_total);
            const unitarioNum = parseFloat(item.costo_unitario_compra || (costoNum / cantNum));

            return (
              <View key={item.id_compra} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.nombre_materia_prima}</Text>
                    <Text style={styles.cardDate}>Fecha: {item.fecha_compra}</Text>
                  </View>

                  <View style={styles.stockBadge}>
                    <Text style={styles.stockBadgeText}>
                      Stock actual: {parseFloat(item.stock_actual_insumo).toFixed(2)} {item.unidad_medida}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Cantidad</Text>
                    <Text style={[styles.dataValue, { color: '#60a5fa' }]}>
                      +{cantNum.toFixed(2)} {item.unidad_medida}
                    </Text>
                  </View>

                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Costo Unit.</Text>
                    <Text style={styles.dataValue}>
                      ${unitarioNum.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Costo Total</Text>
                    <Text style={[styles.dataValue, { color: '#34d399' }]}>
                      ${costoNum.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={() => {
                      setCompraAEliminar(item);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#f87171" />
                    <Text style={styles.btnDeleteText}>Anular Compra</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Nueva Compra */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar Compra</Text>
                <Text style={styles.modalSub}>Ingreso de insumos a almacén</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Insumo / Ingrediente *</Text>
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
                        {i.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Fecha Compra *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor="#64748b"
                    value={formData.fecha_compra}
                    onChangeText={(t) => setFormData({ ...formData, fecha_compra: t })}
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
                    value={formData.cantidad}
                    onChangeText={(t) => setFormData({ ...formData, cantidad: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Costo Total Pagado ($ MXN) *</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                value={formData.costo_total}
                onChangeText={(t) => setFormData({ ...formData, costo_total: t })}
              />

              {Boolean(formData.cantidad && formData.costo_total && Number(formData.cantidad) > 0) && (
                <View style={styles.estimateBox}>
                  <Text style={styles.estimateLabel}>Costo Unitario Resultante:</Text>
                  <Text style={styles.estimateValue}>
                    ${(Number(formData.costo_total) / Number(formData.cantidad)).toFixed(2)} MXN / {insumoSeleccionado?.unidad_medida}
                  </Text>
                </View>
              )}

              {Boolean(insumoSeleccionado && formData.cantidad && Number(formData.cantidad) > 0) && (
                <View style={styles.impactBox}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#34d399" />
                  <Text style={styles.impactText}>
                    El stock aumentará de {parseFloat(insumoSeleccionado.cantidad_disponible).toFixed(2)} a{' '}
                    {(parseFloat(insumoSeleccionado.cantidad_disponible) + Number(formData.cantidad)).toFixed(2)} {insumoSeleccionado.unidad_medida}.
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
                  style={[styles.btnPrimary, guardando && { opacity: 0.7 }]}
                  onPress={handleCrearSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Registrar Compra</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      <Modal visible={deleteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={styles.deleteIconWrap}>
              <Feather name="trash-2" size={28} color="#f43f5e" />
            </View>
            <Text style={styles.modalTitle}>¿Anular Compra?</Text>
            <Text style={styles.deleteDesc}>
              Se anulará la compra de "{compraAEliminar?.nombre_materia_prima}" del {compraAEliminar?.fecha_compra}.
              {'\n\n'}
              <Text style={{ color: '#f87171', fontWeight: 'bold' }}>
                Se restarán {compraAEliminar?.cantidad} {compraAEliminar?.unidad_medida} del inventario.
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
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)'
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
  stockBadge: { backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  stockBadgeText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a',
    borderRadius: 10, padding: 10, marginBottom: 10
  },
  dataCol: { alignItems: 'center' },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  btnDelete: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6,
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
  insumoPillActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  insumoPillText: { color: '#94a3b8', fontSize: 12 },
  insumoPillTextActive: { color: '#ffffff', fontWeight: 'bold' },
  estimateBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estimateLabel: { color: '#94a3b8', fontSize: 12 },
  estimateValue: { color: '#34d399', fontWeight: 'bold', fontSize: 14 },
  impactBox: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)', borderRadius: 10, padding: 10, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactText: { color: '#a7f3d0', fontSize: 11, flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

