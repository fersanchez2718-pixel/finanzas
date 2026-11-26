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

const API_USUARIOS = ENDPOINTS.usuarios;

export default function AdministracionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    desgloseRoles: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<any>(null);

  // Toast
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    email: '',
    password: '',
    rol: 'Cajero',
    estado: 'Activo'
  });

  const showToast = (mensaje: string, tipo: 'success' | 'error' = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroRol !== 'Todos') params.append('rol', filtroRol);
      if (filtroEstado !== 'Todos') params.append('estado', filtroEstado);

      const res = await fetch(`${API_USUARIOS}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsuarios(data.data || []);
        if (data.resumen) setResumen(data.resumen);
      } else {
        showToast(data.message || 'Error al obtener usuarios', 'error');
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      showToast('Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [filtroRol, filtroEstado]);

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      nombre_completo: '',
      username: '',
      email: '',
      password: '',
      rol: 'Cajero',
      estado: 'Activo'
    });
    setModalOpen(true);
  };

  const abrirModalEditar = (usr: any) => {
    setModoEdicion(true);
    setIdEditando(usr.id_usuario);
    setFormData({
      nombre_completo: usr.nombre_completo,
      username: usr.username,
      email: usr.email,
      password: '',
      rol: usr.rol,
      estado: usr.estado
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre_completo.trim() || !formData.email.trim() || !formData.rol) {
      showToast('Campos obligatorios incompletos', 'error');
      return;
    }

    if (!modoEdicion && (!formData.username.trim() || !formData.password.trim())) {
      showToast('Usuario y contraseña son requeridos para cuentas nuevas', 'error');
      return;
    }

    setGuardando(true);
    try {
      const url = modoEdicion ? `${API_USUARIOS}/${idEditando}` : API_USUARIOS;
      const method = modoEdicion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Usuario guardado exitosamente');
        setModalOpen(false);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al guardar usuario', 'error');
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      showToast('Error de comunicación con el servidor', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!usuarioAEliminar) return;
    try {
      const res = await fetch(`${API_USUARIOS}/${usuarioAEliminar.id_usuario}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cuenta de usuario eliminada correctamente');
        setDeleteModalOpen(false);
        setUsuarioAEliminar(null);
        cargarUsuarios();
      } else {
        showToast(data.message || 'Error al eliminar usuario', 'error');
      }
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showToast('Error de conexión', 'error');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    return u.nombre_completo.toLowerCase().includes(texto) ||
      u.username.toLowerCase().includes(texto) ||
      u.email.toLowerCase().includes(texto) ||
      u.rol.toLowerCase().includes(texto);
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
            <MaterialCommunityIcons name="account-cog" size={26} color="#c084fc" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Administración de Usuarios</Text>
            <Text style={styles.subtitle}>Cuentas, roles y permisos internos</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={cargarUsuarios} disabled={loading}>
            <Feather name="refresh-cw" size={16} color="#94a3b8" />
            <Text style={styles.btnSecondaryText}>Actualizar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPurple} onPress={abrirModalCrear}>
            <Feather name="user-plus" size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>Crear Usuario</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpisScroll}>
          <View style={[styles.kpiCard, { borderLeftColor: '#c084fc' }]}>
            <Text style={styles.kpiLabel}>Cuentas</Text>
            <Text style={styles.kpiValue}>{resumen.totalUsuarios || usuarios.length}</Text>
            <Text style={styles.kpiSub}>Operadores</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Activos</Text>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>
              {resumen.usuariosActivos || 0}
            </Text>
            <Text style={[styles.kpiSub, { color: '#a7f3d0' }]}>Con acceso</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#a855f7' }]}>
            <Text style={styles.kpiLabel}>Admins</Text>
            <Text style={[styles.kpiValue, { color: '#c084fc' }]}>
              {resumen.desgloseRoles?.Administrador || 1}
            </Text>
            <Text style={[styles.kpiSub, { color: '#e9d5ff' }]}>Acceso total</Text>
          </View>

          <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.kpiLabel}>Operativos</Text>
            <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>
              {(resumen.desgloseRoles?.Cajero || 0) + (resumen.desgloseRoles?.Almacen || 0)}
            </Text>
            <Text style={[styles.kpiSub, { color: '#fde68a' }]}>Caja y cocina</Text>
          </View>
        </ScrollView>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por nombre, usuario, email o rol..."
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

        {/* Filtros de Rol */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {['Todos', 'Administrador', 'Cajero', 'Almacen'].map((r) => {
            const activo = filtroRol === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.filterChip, activo && styles.filterChipActive]}
                onPress={() => setFiltroRol(r)}
              >
                <Text style={[styles.filterChipText, activo && styles.filterChipTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Listado de Usuarios */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#a855f7" />
            <Text style={styles.loadingText}>Cargando cuentas de usuario...</Text>
          </View>
        ) : usuariosFiltrados.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="account-remove-outline" size={44} color="#475569" />
            <Text style={styles.emptyTitle}>No se encontraron cuentas</Text>
            <Text style={styles.emptySub}>Presiona "+ Crear Usuario" para registrar un nuevo operador.</Text>
          </View>
        ) : (
          usuariosFiltrados.map((u) => (
            <View key={u.id_usuario} style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{u.nombre_completo}</Text>
                  <Text style={styles.cardUsername}>@{u.username} • {u.email}</Text>
                </View>

                <View style={u.rol === 'Administrador' ? styles.badgePurple : u.rol === 'Cajero' ? styles.badgeGreen : styles.badgeAmber}>
                  <Text style={u.rol === 'Administrador' ? styles.badgeTextPurple : u.rol === 'Cajero' ? styles.badgeTextGreen : styles.badgeTextAmber}>
                    {u.rol}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.dataCol}>
                  <Text style={styles.dataLabel}>Estado</Text>
                  <Text style={[styles.dataValue, { color: u.estado === 'Activo' ? '#34d399' : '#f87171' }]}>
                    {u.estado}
                  </Text>
                </View>

                <View style={styles.dataCol}>
                  <Text style={styles.dataLabel}>Registro</Text>
                  <Text style={styles.dataValue}>{u.fecha_registro || '2026-11-01'}</Text>
                </View>

                <View style={[styles.dataCol, { flex: 1.5, alignItems: 'flex-start' }]}>
                  <Text style={styles.dataLabel}>Último Acceso</Text>
                  <Text style={[styles.dataValue, { fontSize: 11, color: '#cbd5e1' }]}>
                    {u.ultimo_acceso || 'Reciente'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => abrirModalEditar(u)}
                >
                  <Feather name="edit-2" size={14} color="#818cf8" />
                  <Text style={[styles.cardActionText, { color: '#818cf8' }]}>Editar Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cardActionBtn, { borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                  onPress={() => {
                    setUsuarioAEliminar(u);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Feather name="trash-2" size={14} color="#f87171" />
                  <Text style={[styles.cardActionText, { color: '#f87171' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Crear / Editar Usuario */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {modoEdicion ? 'Editar Usuario' : 'Crear Nueva Cuenta'}
                </Text>
                <Text style={styles.modalSub}>Acceso y privilegios en el sistema</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Nombre Completo *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="ej. Brenda Morales"
                placeholderTextColor="#64748b"
                value={formData.nombre_completo}
                onChangeText={(t) => setFormData({ ...formData, nombre_completo: t })}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Nombre de Usuario *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="ej. bmorales"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    value={formData.username}
                    onChangeText={(t) => setFormData({ ...formData, username: t })}
                    editable={!modoEdicion}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Correo Electrónico *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="correo@fooderp.com"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>
                {modoEdicion ? 'Restablecer Contraseña (opcional)' : 'Contraseña *'}
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder={modoEdicion ? 'Dejar en blanco para no modificar' : '••••••••'}
                placeholderTextColor="#64748b"
                secureTextEntry
                value={formData.password}
                onChangeText={(t) => setFormData({ ...formData, password: t })}
              />

              <Text style={styles.formLabel}>Rol en el Sistema *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {['Administrador', 'Cajero', 'Almacen'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.pillSmall, formData.rol === r && styles.pillSmallActivePurple]}
                    onPress={() => setFormData({ ...formData, rol: r })}
                  >
                    <Text style={[styles.pillSmallText, formData.rol === r && styles.pillSmallTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Estado de la Cuenta</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {['Activo', 'Inactivo'].map((est) => (
                  <TouchableOpacity
                    key={est}
                    style={[styles.pillSmall, formData.estado === est && styles.pillSmallActivePurple]}
                    onPress={() => setFormData({ ...formData, estado: est })}
                  >
                    <Text style={[styles.pillSmallText, formData.estado === est && styles.pillSmallTextActive]}>
                      {est}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalOpen(false)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnPurple, guardando && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>
                      {modoEdicion ? 'Actualizar Cuenta' : 'Crear Usuario'}
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
            <Text style={styles.modalTitle}>¿Eliminar Usuario?</Text>
            <Text style={styles.deleteDesc}>
              Se eliminará la cuenta de "{usuarioAEliminar?.nombre_completo}". El usuario perderá el acceso al sistema.
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
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(192, 132, 252, 0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(192, 132, 252, 0.3)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8' },
  headerActions: { flexDirection: 'row', gap: 10 },
  btnPurple: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#9333ea',
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
  filterChipActive: { backgroundColor: '#9333ea' },
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
  cardUsername: { color: '#94a3b8', fontSize: 11, marginTop: 1 },
  badgePurple: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)', borderWidth: 1, borderColor: 'rgba(192, 132, 252, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeTextPurple: { color: '#c084fc', fontSize: 11, fontWeight: 'bold' },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeTextGreen: { color: '#34d399', fontSize: 11, fontWeight: 'bold' },
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12
  },
  badgeTextAmber: { color: '#fbbf24', fontSize: 11, fontWeight: 'bold' },
  cardBody: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0f172a',
    borderRadius: 10, padding: 10, marginBottom: 10
  },
  dataCol: { alignItems: 'center' },
  dataLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  dataValue: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
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
  pillSmallActivePurple: { backgroundColor: '#9333ea', borderColor: '#9333ea' },
  pillSmallText: { color: '#94a3b8', fontSize: 11 },
  pillSmallTextActive: { color: '#ffffff', fontWeight: 'bold' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18, borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 14 },
  deleteIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(244, 63, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  deleteDesc: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginVertical: 12 },
});

