import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../config/api';

const API_URL = ENDPOINTS.materiaPrima;

export default function CatalogoMateriaPrima() {
  const [insumos, setInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    unidad_medida: 'Kg',
    cantidad_disponible: '',
    costo_unitario: '',
    estado: 'Disponible'
  });

  // Modal Eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemAEliminar, setItemAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const cargarInsumos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.success) {
        setInsumos(data.data || []);
      } else {
        setError(data.message || 'Error al obtener datos');
      }
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      setError('No se pudo conectar con el servidor backend. Verifica que esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      nombre: '',
      unidad_medida: 'Kg',
      cantidad_disponible: '',
      costo_unitario: '',
      estado: 'Disponible'
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (item: any) => {
    setModoEdicion(true);
    setIdEditando(item.id_materia_prima);
    setFormData({
      nombre: item.nombre,
      unidad_medida: item.unidad_medida,
      cantidad_disponible: String(item.cantidad_disponible),
      costo_unitario: String(item.costo_unitario),
      estado: item.estado
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.unidad_medida || formData.cantidad_disponible === '' || formData.costo_unitario === '') {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_URL}/${idEditando}` : API_URL;
      const method = modoEdicion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();

      if (resData.success) {
        showToast(
          modoEdicion ? 'Insumo actualizado exitosamente' : 'Ingrediente registrado exitosamente',
          'success'
        );
        setModalOpen(false);
        cargarInsumos();
      } else {
        showToast(resData.message || 'Error al guardar', 'error');
      }
    } catch (err) {
      console.error('Error al guardar en backend:', err);
      showToast('Error de conexión con el servidor backend', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!itemAEliminar) return;
    try {
      const response = await fetch(`${API_URL}/${itemAEliminar.id_materia_prima}`, {
        method: 'DELETE'
      });
      const resData = await response.json();
      if (resData.success) {
        showToast('✓ Insumo eliminado del catálogo', 'success');
        setDeleteModalOpen(false);
        setItemAEliminar(null);
        cargarInsumos();
      } else {
        showToast(resData.message || 'No se pudo eliminar', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      showToast('Error al conectar con el servidor', 'error');
    }
  };

  const insumosFiltrados = insumos.filter((item) => {
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  // Métricas
  const totalInsumos = insumos.length;
  const valorTotalAlmacen = insumos.reduce((acc, item) => {
    return acc + (Number(item.cantidad_disponible) * Number(item.costo_unitario));
  }, 0);
  const stockCriticoCount = insumos.filter(i => i.estado === 'Stock Bajo' || i.estado === 'Agotado').length;
  const disponiblesCount = insumos.filter(i => i.estado === 'Disponible').length;

  return (
    <View style={styles.container}>
      {/* Toast Flotante */}
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
            <MaterialCommunityIcons name="carrot" size={26} color="#fb923c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Catálogo Materia Prima</Text>
            <Text style={styles.subtitle}>Control maestro de insumos culinarios</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={cargarInsumos}
            disabled={loading}
          >
            <Feather name="refresh-cw" size={16} color="#94a3b8" />
            <Text style={styles.btnSecondaryText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={abrirModalCrear}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Nuevo Insumo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#f97316' }]}>
            <Text style={styles.kpiLabel}>Total Insumos</Text>
            <Text style={styles.kpiValue}>{totalInsumos}</Text>
            <Text style={styles.kpiSub}>En catálogo</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Inversión Almacén</Text>
            <Text style={styles.kpiValue}>
              ${valorTotalAlmacen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: '#34d399' }]}>Valor inventario</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Stock Óptimo</Text>
            <Text style={styles.kpiValue}>{disponiblesCount}</Text>
            <Text style={[styles.kpiSub, { color: '#818cf8' }]}>Disponibles</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f43f5e' }]}>
            <Text style={styles.kpiLabel}>Críticos</Text>
            <Text style={[styles.kpiValue, { color: '#f87171' }]}>{stockCriticoCount}</Text>
            <Text style={[styles.kpiSub, { color: '#fca5a5' }]}>Bajo / Agotado</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar ingrediente (ej. Pollo, Queso)..."
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

        {/* Filtros de Estado */}
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

        {/* Listado de Insumos */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Cargando catálogo...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={44} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.btnRetry} onPress={cargarInsumos}>
              <Text style={styles.btnRetryText}>Reintentar Conexión</Text>
            </TouchableOpacity>
          </View>
        ) : insumosFiltrados.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="carrot" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No se encontraron insumos</Text>
            <Text style={styles.emptySub}>Prueba modificando la búsqueda o agrega uno nuevo.</Text>
          </View>
        ) : (
          insumosFiltrados.map((item) => {
            const stockNum = Number(item.cantidad_disponible);
            const costoNum = Number(item.costo_unitario);
            const subtotal = stockNum * costoNum;

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

                <View style={styles.cardBody}>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Stock</Text>
                    <Text style={[styles.dataValue, stockNum <= 5 ? { color: '#f59e0b' } : null]}>
                      {stockNum.toFixed(2)} {item.unidad_medida}
                    </Text>
                  </View>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Costo Unit.</Text>
                    <Text style={styles.dataValue}>${costoNum.toFixed(2)}</Text>
                  </View>
                  <View style={styles.dataCol}>
                    <Text style={styles.dataLabel}>Valor Total</Text>
                    <Text style={[styles.dataValue, { color: '#34d399' }]}>
                      ${subtotal.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => abrirModalEditar(item)}
                  >
                    <Feather name="edit-2" size={15} color="#818cf8" />
                    <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { borderColor: '#f43f5e33' }]}
                    onPress={() => {
                      setItemAEliminar(item);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="trash-2" size={15} color="#f87171" />
                    <Text style={[styles.cardActionText, { color: '#f87171' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Formulario: Crear / Editar */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modoEdicion ? 'Editar Insumo' : 'Nuevo Ingrediente'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nombre del Insumo *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. Carne Molida 80/20"
                placeholderTextColor="#64748b"
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              />

              <Text style={styles.formLabel}>Unidad de Medida *</Text>
              <View style={styles.unitSelector}>
                {['Kg', 'Litro', 'Pza', 'Gramos', 'Paquete'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, formData.unidad_medida === u && styles.unitBtnActive]}
                    onPress={() => setFormData({ ...formData, unidad_medida: u })}
                  >
                    <Text style={[styles.unitBtnText, formData.unidad_medida === u && styles.unitBtnTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Stock Disponible *</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={formData.cantidad_disponible}
                    onChangeText={(cant) => {
                      let nuevoEstado = formData.estado;
                      const num = Number(cant);
                      if (num <= 0) nuevoEstado = 'Agotado';
                      else if (num <= 5) nuevoEstado = 'Stock Bajo';
                      else nuevoEstado = 'Disponible';
                      setFormData({ ...formData, cantidad_disponible: cant, estado: nuevoEstado });
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Costo Unitario ($) *</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={formData.costo_unitario}
                    onChangeText={(costo) => setFormData({ ...formData, costo_unitario: costo })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Estado Operativo</Text>
              <View style={styles.unitSelector}>
                {['Disponible', 'Stock Bajo', 'Agotado'].map((est) => (
                  <TouchableOpacity
                    key={est}
                    style={[styles.unitBtn, formData.estado === est && styles.unitBtnActive]}
                    onPress={() => setFormData({ ...formData, estado: est })}
                  >
                    <Text style={[styles.unitBtnText, formData.estado === est && styles.unitBtnTextActive]}>
                      {est}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {Boolean(formData.cantidad_disponible && formData.costo_unitario) && (
                <View style={styles.estimateBox}>
                  <Text style={styles.estimateLabel}>Valor Total Estimado:</Text>
                  <Text style={styles.estimateValue}>
                    ${(Number(formData.cantidad_disponible) * Number(formData.costo_unitario)).toFixed(2)} MXN
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
                  onPress={handleSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </Text>
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
            <Text style={styles.modalTitle}>¿Eliminar Insumo?</Text>
            <Text style={styles.deleteDesc}>
              Estás a punto de eliminar "{itemAEliminar?.nombre}". Esta acción no se puede deshacer.
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
                <Text style={styles.btnPrimaryText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
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
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#e11d48',
  },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  header: {
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
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
  },
  btnSecondaryText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  btnDanger: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  kpisScroll: {
    marginBottom: 14,
  },
  kpiCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 130,
  },
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  kpiValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  kpiSub: {
    color: '#64748b',
    fontSize: 10,
  },
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
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  filtersScroll: {
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 8,
  },
  btnRetry: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnRetryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 8,
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  cardItem: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardUnit: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeTextSuccess: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeTextWarning: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  badgeTextDanger: {
    color: '#fb7185',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  dataCol: {
    alignItems: 'center',
  },
  dataLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dataValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
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
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  unitBtn: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  unitBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#ffffff',
  },
  estimateBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimateLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  estimateValue: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
  deleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
});

