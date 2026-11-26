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
  Linking
} from 'react-native';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { ENDPOINTS } from '../config/api';

const API_PROVEEDORES = ENDPOINTS.proveedores;

export default function DirectorioProveedores() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    total_proveedores: 0,
    proveedores_activos: 0,
    total_categorias: 0
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    nombre_comercial: '',
    razon_social: '',
    contacto_nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    categoria_suministro: 'Carnes y Aves',
    dias_entrega: 'Lunes a Viernes',
    estado: 'Activo',
    notas: ''
  });

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCategoria !== 'Todas') params.append('categoria', filtroCategoria);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);

      const res = await fetch(`${API_PROVEEDORES}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProveedores(data.data || []);
        if (data.resumen) setResumen(data.resumen);
      } else {
        showToast(data.message || 'Error al obtener proveedores', 'error');
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, [filtroCategoria, filtroEstado]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      nombre_comercial: '',
      razon_social: '',
      contacto_nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      categoria_suministro: 'Carnes y Aves',
      dias_entrega: 'Lunes a Viernes',
      estado: 'Activo',
      notas: ''
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (prov: any) => {
    setModoEdicion(true);
    setIdEditando(prov.id_proveedor);
    setFormData({
      nombre_comercial: prov.nombre_comercial,
      razon_social: prov.razon_social || '',
      contacto_nombre: prov.contacto_nombre || '',
      telefono: prov.telefono,
      email: prov.email || '',
      direccion: prov.direccion || '',
      categoria_suministro: prov.categoria_suministro,
      dias_entrega: prov.dias_entrega || 'Bajo Pedido',
      estado: prov.estado,
      notas: prov.notas || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre_comercial.trim() || !formData.telefono.trim()) {
      showToast('Nombre comercial y teléfono son requeridos', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_PROVEEDORES}/${idEditando}` : API_PROVEEDORES;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Proveedor guardado correctamente');
        setModalOpen(false);
        cargarProveedores();
      } else {
        showToast(data.message || 'Error al guardar proveedor', 'error');
      }
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!proveedorAEliminar) return;
    try {
      const res = await fetch(`${API_PROVEEDORES}/${proveedorAEliminar.id_proveedor}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Proveedor eliminado del directorio');
        setDeleteModalOpen(false);
        setProveedorAEliminar(null);
        cargarProveedores();
      } else {
        showToast(data.message || 'Error al eliminar proveedor', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar proveedor:', err);
      showToast('Error de conexión', 'error');
    }
  };

  const proveedoresFiltrados = proveedores.filter(p => {
    const texto = busqueda.toLowerCase();
    return p.nombre_comercial.toLowerCase().includes(texto) ||
      (p.contacto_nombre && p.contacto_nombre.toLowerCase().includes(texto)) ||
      p.categoria_suministro.toLowerCase().includes(texto) ||
      p.telefono.includes(texto);
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
            <MaterialCommunityIcons name="card-account-phone" size={26} color="#2dd4bf" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Directorio de Proveedores</Text>
            <Text style={styles.subtitle}>Red de abastecimiento del restaurante</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={cargarProveedores} disabled={loading}>
            <Feather name="refresh-cw" size={16} color="#94a3b8" />
            <Text style={styles.btnSecondaryText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnTeal} onPress={abrirModalCrear}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Nuevo Proveedor</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#14b8a6' }]}>
            <Text style={styles.kpiLabel}>Total Proveedores</Text>
            <Text style={styles.kpiValue}>{resumen.total_proveedores || 0}</Text>
            <Text style={styles.kpiSub}>En directorio</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Activos</Text>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>
              {resumen.proveedores_activos || 0}
            </Text>
            <Text style={[styles.kpiSub, { color: '#a7f3d0' }]}>En operación</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.kpiLabel}>Categorías</Text>
            <Text style={styles.kpiValue}>{resumen.total_categorias || 0}</Text>
            <Text style={styles.kpiSub}>Líneas de suministro</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por comercial, contacto, teléfono..."
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
          {[
            'Todas',
            'Carnes y Aves',
            'Frutas y Verduras',
            'Panadería y Masas',
            'Lácteos y Quesos',
            'Empaques y Desechables',
            'Servicios y Gas'
          ].map((cat) => {
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

        {/* Listado de Proveedores */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#14b8a6" />
            <Text style={styles.loadingText}>Cargando directorio...</Text>
          </View>
        ) : proveedoresFiltrados.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="truck-remove-outline" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No se encontraron proveedores</Text>
            <Text style={styles.emptySub}>Presiona "+ Nuevo Proveedor" para agregarlo al directorio.</Text>
          </View>
        ) : (
          proveedoresFiltrados.map((prov) => (
            <View key={prov.id_proveedor} style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{prov.nombre_comercial}</Text>
                  {Boolean(prov.razon_social) && (
                    <Text style={styles.cardLegal}>{prov.razon_social}</Text>
                  )}
                </View>

                <View style={styles.badgeCategory}>
                  <Text style={styles.badgeCategoryText}>{prov.categoria_suministro}</Text>
                </View>
              </View>

              <View style={styles.provInfoBox}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={13} color="#94a3b8" />
                  <Text style={styles.infoText}>
                    Contacto: {prov.contacto_nombre || 'No especificado'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Feather name="phone" size={13} color="#2dd4bf" />
                  <Text style={[styles.infoText, { color: '#2dd4bf', fontWeight: 'bold' }]}>
                    {prov.telefono}
                  </Text>
                </View>

                {Boolean(prov.email) && (
                  <View style={styles.infoRow}>
                    <Feather name="mail" size={13} color="#94a3b8" />
                    <Text style={styles.infoText}>{prov.email}</Text>
                  </View>
                )}

                {Boolean(prov.direccion) && (
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={13} color="#94a3b8" />
                    <Text style={styles.infoText} numberOfLines={1}>{prov.direccion}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Feather name="calendar" size={13} color="#fbbf24" />
                  <Text style={[styles.infoText, { color: '#fde68a' }]}>
                    Entregas: {prov.dias_entrega}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.btnCall}
                  onPress={() => Linking.openURL(`tel:${prov.telefono}`)}
                >
                  <Feather name="phone-call" size={13} color="#2dd4bf" />
                  <Text style={styles.btnCallText}>Llamar</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => abrirModalEditar(prov)}
                  >
                    <Feather name="edit-2" size={14} color="#818cf8" />
                    <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                    onPress={() => {
                      setProveedorAEliminar(prov);
                      setDeleteModalOpen(true);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#f87171" />
                    <Text style={[styles.cardActionText, { color: '#f87171' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Crear / Editar Proveedor */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modoEdicion ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </Text>
                <Text style={styles.modalSub}>Ficha de contacto y suministro</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nombre Comercial *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. Carnicería La Selecta"
                placeholderTextColor="#64748b"
                value={formData.nombre_comercial}
                onChangeText={(t) => setFormData({ ...formData, nombre_comercial: t })}
              />

              <Text style={styles.formLabel}>Razón Social</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. Distribuidora Cárnica del Norte S.A."
                placeholderTextColor="#64748b"
                value={formData.razon_social}
                onChangeText={(t) => setFormData({ ...formData, razon_social: t })}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Persona de Contacto</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="ej. Ing. Roberto Garza"
                    placeholderTextColor="#64748b"
                    value={formData.contacto_nombre}
                    onChangeText={(t) => setFormData({ ...formData, contacto_nombre: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Teléfono *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="55-1234-5678"
                    placeholderTextColor="#64748b"
                    value={formData.telefono}
                    onChangeText={(t) => setFormData({ ...formData, telefono: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Categoría de Suministro *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {[
                  'Carnes y Aves',
                  'Frutas y Verduras',
                  'Panadería y Masas',
                  'Lácteos y Quesos',
                  'Empaques y Desechables',
                  'Servicios y Gas',
                  'Abarrotes y Especias',
                  'Bebidas y Refrescos'
                ].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.pillSmall, formData.categoria_suministro === c && styles.pillSmallActive]}
                    onPress={() => setFormData({ ...formData, categoria_suministro: c })}
                  >
                    <Text style={[styles.pillSmallText, formData.categoria_suministro === c && styles.pillSmallTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Correo Electrónico</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="contacto@proveedor.com"
                    placeholderTextColor="#64748b"
                    value={formData.email}
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Días de Entrega</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Lunes y Jueves"
                    placeholderTextColor="#64748b"
                    value={formData.dias_entrega}
                    onChangeText={(t) => setFormData({ ...formData, dias_entrega: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Dirección / Bodega</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Av. Central #123, Bodega 4"
                placeholderTextColor="#64748b"
                value={formData.direccion}
                onChangeText={(t) => setFormData({ ...formData, direccion: t })}
              />

              <Text style={styles.formLabel}>Notas / Acuerdos Comerciales</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Precios de lista, crédito a 15 días, etc."
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
                  style={[styles.btnTeal, guardando && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {modoEdicion ? 'Actualizar Ficha' : 'Guardar Proveedor'}
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
            <Text style={styles.modalTitle}>¿Eliminar Proveedor?</Text>
            <Text style={styles.deleteDesc}>
              Se eliminará a "{proveedorAEliminar?.nombre_comercial}" del directorio. Esta acción no se puede deshacer.
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
                <Text style={styles.btnPrimaryText}>Sí, Eliminar</Text>
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
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(20, 184, 166, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.3)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  headerActions: { flexDirection: 'row', gap: 10 },
  btnTeal: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0d9488',
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
    borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 10
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13 },
  filtersScroll: { marginBottom: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0d9488' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cardLegal: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  badgeCategory: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeCategoryText: { color: '#2dd4bf', fontSize: 11, fontWeight: 'bold' },
  provInfoBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 10, marginBottom: 10, gap: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: '#cbd5e1', fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnCall: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.3)'
  },
  btnCallText: { color: '#2dd4bf', fontSize: 11, fontWeight: 'bold' },
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
  pillSmallActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  pillSmallText: { color: '#94a3b8', fontSize: 11 },
  pillSmallTextActive: { color: '#ffffff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

