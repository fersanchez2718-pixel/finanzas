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

const API_INVENTARIO = ENDPOINTS.inventario;

export default function GestionInventario() {
  const [inventario, setInventario] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    totalInsumos: 0,
    valorTotal: 0,
    stockCritico: 0,
    totalUnidades: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modal Ajuste
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
  const [tipoAjuste, setTipoAjuste] = useState<'fijar' | 'sumar' | 'restar'>('fijar');
  const [cantidadAjuste, setCantidadAjuste] = useState('');
  const [motivoAjuste, setMotivoAjuste] = useState('Reconteo físico de turno');
  const [guardando, setGuardando] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarInventario = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_INVENTARIO);
      const data = await res.json();
      if (data.success) {
        setInventario(data.data || []);
        if (data.resumen) setResumen(data.resumen);
      } else {
        setError(data.message || 'Error al consultar inventario');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const abrirModalAjuste = (item: any) => {
    setItemSeleccionado(item);
    setTipoAjuste('fijar');
    setCantidadAjuste(String(item.cantidad_disponible));
    setMotivoAjuste('Reconteo físico de turno');
    setModalAjusteOpen(true);
  };

  const handleAjusteSubmit = async () => {
    if (!itemSeleccionado || cantidadAjuste === '') {
      showToast('Ingresa una cantidad válida', 'error');
      return;
    }

    const cantNum = parseFloat(cantidadAjuste);
    if (isNaN(cantNum) || cantNum < 0) {
      showToast('La cantidad debe ser mayor o igual a cero', 'error');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_INVENTARIO}/${itemSeleccionado.id_materia_prima}/ajuste`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_ajuste: tipoAjuste,
          cantidad: cantNum,
          motivo: motivoAjuste
        })
      });

      const resData = await res.json();
      if (resData.success) {
        showToast(resData.message || 'Stock actualizado correctamente');
        setModalAjusteOpen(false);
        cargarInventario();
      } else {
        showToast(resData.message || 'Error al ajustar stock', 'error');
      }
    } catch (err) {
      console.error('Error al ajustar:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const calcularStockProyectado = () => {
    if (!itemSeleccionado || cantidadAjuste === '') return null;
    const actual = parseFloat(itemSeleccionado.cantidad_disponible);
    const input = parseFloat(cantidadAjuste);
    if (isNaN(input)) return null;

    let resultado = actual;
    if (tipoAjuste === 'fijar') resultado = input;
    else if (tipoAjuste === 'sumar') resultado = actual + input;
    else if (tipoAjuste === 'restar') resultado = Math.max(0, actual - input);

    return resultado;
  };

  const itemsFiltrados = inventario.filter(item => {
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

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
            <MaterialCommunityIcons name="package-variant" size={26} color="#818cf8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Gestión de Inventario</Text>
            <Text style={styles.subtitle}>Existencias y auditoría de almacén</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={cargarInventario}
          disabled={loading}
        >
          <Feather name="refresh-cw" size={16} color="#94a3b8" />
          <Text style={styles.btnSecondaryText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Insumos Totales</Text>
            <Text style={styles.kpiValue}>{resumen.totalInsumos}</Text>
            <Text style={styles.kpiSub}>Artículos auditados</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Valor Almacén</Text>
            <Text style={styles.kpiValue}>
              ${Number(resumen.valorTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#34d399' }]}>Existencias valorizadas</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.kpiLabel}>Volumen Físico</Text>
            <Text style={styles.kpiValue}>
              {Number(resumen.totalUnidades).toLocaleString('es-MX', { maximumFractionDigits: 1 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#60a5fa' }]}>Unidades acumuladas</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f43f5e' }]}>
            <Text style={styles.kpiLabel}>Críticos</Text>
            <Text style={[styles.kpiValue, { color: '#f87171' }]}>{resumen.stockCritico}</Text>
            <Text style={[styles.kpiSub, { color: '#fca5a5' }]}>Por agotarse o sin stock</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por insumo..."
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

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {['Todos', 'Disponible', 'Stock Bajo', 'Agotado'].map((est) => {
            const activo = filtroEstado === est;
            return (
              <TouchableOpacity
                key={est}
                style={[styles.filterChip, activo && styles.filterChipActive]}
                onPress={() => setFiltroEstado(est)}
              >
                <Text style={[styles.filterChipText, activo && styles.filterChipTextActive]}>
                  {est}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Listado */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando inventario...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={44} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={cargarInventario}>
              <Text style={styles.btnRetryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : itemsFiltrados.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="package-variant-closed" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No se encontraron registros</Text>
            <Text style={styles.emptySub}>Prueba con otros términos de búsqueda.</Text>
          </View>
        ) : (
          itemsFiltrados.map((item) => {
            const stockNum = parseFloat(item.cantidad_disponible);
            const porcentaje = Math.min(item.porcentaje_stock || 0, 100);
            const valor = parseFloat(item.valor_inventario || 0);

            let barColor = '#10b981';
            if (stockNum <= 0) barColor = '#f43f5e';
            else if (stockNum <= 5) barColor = '#f59e0b';

            return (
              <View key={item.id_materia_prima} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.nombre}</Text>
                    <Text style={styles.cardUnit}>Unidad: {item.unidad_medida}</Text>
                  </View>

                  {item.estado === 'Disponible' && (
                    <View style={[styles.badge, styles.badgeSuccess]}>
                      <Text style={styles.badgeTextSuccess}>Disponible</Text>
                    </View>
                  )}
                  {item.estado === 'Stock Bajo' && (
                    <View style={[styles.badge, styles.badgeWarning]}>
                      <Text style={styles.badgeTextWarning}>Stock Bajo</Text>
                    </View>
                  )}
                  {item.estado === 'Agotado' && (
                    <View style={[styles.badge, styles.badgeDanger]}>
                      <Text style={styles.badgeTextDanger}>Agotado</Text>
                    </View>
                  )}
                </View>

                {/* Barra de progreso de Capacidad */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Nivel de Capacidad</Text>
                    <Text style={styles.progressValue}>{porcentaje}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${porcentaje}%`, backgroundColor: barColor }]} />
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Existencia</Text>
                    <Text style={[styles.dataValue, stockNum <= 5 ? { color: '#f59e0b' } : null]}>
                      {stockNum.toFixed(2)} {item.unidad_medida}
                    </Text>
                  </View>

                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Valor Total</Text>
                    <Text style={[styles.dataValue, { color: '#34d399' }]}>
                      ${valor.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.btnAjustar}
                    onPress={() => abrirModalAjuste(item)}
                  >
                    <MaterialCommunityIcons name="tune-vertical" size={16} color="#818cf8" />
                    <Text style={styles.btnAjustarText}>Ajustar Existencia</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Ajuste de Stock */}
      <Modal visible={modalAjusteOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ajuste de Stock</Text>
                <Text style={styles.modalSub}>{itemSeleccionado?.nombre}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalAjusteOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.currentStockBox}>
                <Text style={styles.currentStockLabel}>Stock Actual en Sistema:</Text>
                <Text style={styles.currentStockValue}>
                  {parseFloat(itemSeleccionado?.cantidad_disponible || '0').toFixed(2)} {itemSeleccionado?.unidad_medida}
                </Text>
              </View>

              <Text style={styles.formLabel}>Tipo de Operación</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeBtn, tipoAjuste === 'fijar' && styles.typeBtnActiveIndigo]}
                  onPress={() => setTipoAjuste('fijar')}
                >
                  <Feather name="rotate-ccw" size={14} color={tipoAjuste === 'fijar' ? '#fff' : '#94a3b8'} />
                  <Text style={[styles.typeBtnText, tipoAjuste === 'fijar' && styles.typeBtnTextActive]}>
                    Conteo Fijo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, tipoAjuste === 'sumar' && styles.typeBtnActiveGreen]}
                  onPress={() => setTipoAjuste('sumar')}
                >
                  <Feather name="arrow-up-right" size={14} color={tipoAjuste === 'sumar' ? '#fff' : '#94a3b8'} />
                  <Text style={[styles.typeBtnText, tipoAjuste === 'sumar' && styles.typeBtnTextActive]}>
                    Entrada (+)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, tipoAjuste === 'restar' && styles.typeBtnActiveRed]}
                  onPress={() => setTipoAjuste('restar')}
                >
                  <Feather name="arrow-down-right" size={14} color={tipoAjuste === 'restar' ? '#fff' : '#94a3b8'} />
                  <Text style={[styles.typeBtnText, tipoAjuste === 'restar' && styles.typeBtnTextActive]}>
                    Salida (-)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>
                {tipoAjuste === 'fijar' ? 'Nueva Existencia Real' : tipoAjuste === 'sumar' ? 'Cantidad a Sumar' : 'Cantidad a Restar'} ({itemSeleccionado?.unidad_medida}) *
              </Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                value={cantidadAjuste}
                onChangeText={setCantidadAjuste}
              />

              <Text style={styles.formLabel}>Motivo del Ajuste</Text>
              <View style={styles.motivosList}>
                {[
                  'Reconteo físico de turno',
                  'Merma de cocina',
                  'Consumo operativo',
                  'Corrección de captura'
                ].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.motivoChip, motivoAjuste === m && styles.motivoChipActive]}
                    onPress={() => setMotivoAjuste(m)}
                  >
                    <Text style={[styles.motivoChipText, motivoAjuste === m && styles.motivoChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {calcularStockProyectado() !== null && (
                <View style={styles.projectedBox}>
                  <Text style={styles.projectedLabel}>Stock resultante proyectado:</Text>
                  <Text style={styles.projectedValue}>
                    {calcularStockProyectado()?.toFixed(2)} {itemSeleccionado?.unidad_medida}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setModalAjusteOpen(false)}
                >
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPrimary, guardando && { opacity: 0.7 }]}
                  onPress={handleAjusteSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  toast: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    elevation: 8,
  },
  toastSuccess: { backgroundColor: '#059669' },
  toastError: { backgroundColor: '#e11d48' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 13, flex: 1 },
  header: { marginBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  btnSecondaryText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  kpisScroll: { marginBottom: 14 },
  kpiCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 135,
  },
  kpiLabel: { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  kpiValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
  kpiSub: { color: '#64748b', fontSize: 10 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  filtersScroll: { marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  centerBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94a3b8', fontSize: 13, marginTop: 8 },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center', marginVertical: 8 },
  btnRetry: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnRetryText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15, marginTop: 8 },
  emptySub: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardItem: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cardUnit: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  badgeTextSuccess: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  badgeWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  badgeTextWarning: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  badgeDanger: { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.3)' },
  badgeTextDanger: { color: '#fb7185', fontSize: 11, fontWeight: 'bold' },
  progressContainer: { marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { color: '#94a3b8', fontSize: 11 },
  progressValue: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  progressTrack: { height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  dataCol: { alignItems: 'center' },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  btnAjustar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  btnAjustarText: { color: '#818cf8', fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  currentStockBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentStockLabel: { color: '#94a3b8', fontSize: 12 },
  currentStockValue: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  formLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeBtnActiveIndigo: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  typeBtnActiveGreen: { backgroundColor: '#10b981', borderColor: '#10b981' },
  typeBtnActiveRed: { backgroundColor: '#f43f5e', borderColor: '#f43f5e' },
  typeBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  typeBtnTextActive: { color: '#ffffff' },
  motivosList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  motivoChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  motivoChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  motivoChipText: { color: '#94a3b8', fontSize: 11 },
  motivoChipTextActive: { color: '#ffffff', fontWeight: 'bold' },
  projectedBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectedLabel: { color: '#c7d2fe', fontSize: 12 },
  projectedValue: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
});

