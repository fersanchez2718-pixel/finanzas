import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../components/LoginScreen';

import DashboardView from '../components/DashboardView';
import CatalogoMateriaPrima from '../components/CatalogoMateriaPrima';
import GestionInventario from '../components/GestionInventario';
import RegistroCompras from '../components/RegistroCompras';
import ControlMermas from '../components/ControlMermas';
import RegistroVentas from '../components/RegistroVentas';
import GastosOperativos from '../components/GastosOperativos';
import NominaSueldos from '../components/NominaSueldos';
import DirectorioProveedores from '../components/DirectorioProveedores';
import AdministracionUsuarios from '../components/AdministracionUsuarios';

interface ModuleItem {
  id: string;
  name: string;
  shortName: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const MODULES: ModuleItem[] = [
  { id: 'dashboard', name: 'Dashboard Central', shortName: 'Dashboard', icon: 'view-dashboard-outline' },
  { id: 'catalogo', name: 'Catálogo de Materia Prima', shortName: 'Catálogo', icon: 'food-apple-outline' },
  { id: 'inventario', name: 'Gestión de Inventario', shortName: 'Inventario', icon: 'package-variant-closed' },
  { id: 'compras', name: 'Registro de Compras', shortName: 'Compras', icon: 'cart-outline' },
  { id: 'mermas', name: 'Control de Mermas', shortName: 'Mermas', icon: 'trash-can-outline' },
  { id: 'ventas', name: 'Registro de Ventas', shortName: 'Ventas', icon: 'cash-register' },
  { id: 'gastos', name: 'Gastos Operativos', shortName: 'Gastos', icon: 'receipt' },
  { id: 'nomina', name: 'Nómina y Sueldos', shortName: 'Nómina', icon: 'account-group-outline' },
  { id: 'proveedores', name: 'Directorio de Proveedores', shortName: 'Proveedores', icon: 'card-account-phone-outline' },
  { id: 'usuarios', name: 'Administración de Usuarios', shortName: 'Usuarios', icon: 'account-cog-outline' },
];

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  const [activeModule, setActiveModule] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // ── Guard: si no está autenticado, mostrar pantalla de Login ───────────────
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const currentModule = MODULES.find((m) => m.id === activeModule) || MODULES[0];

  const handleSelectModule = (id: string) => {
    setActiveModule(id);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    setLogoutConfirmOpen(false);
    await logout();
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'catalogo':
        return <CatalogoMateriaPrima />;
      case 'inventario':
        return <GestionInventario />;
      case 'compras':
        return <RegistroCompras />;
      case 'mermas':
        return <ControlMermas />;
      case 'ventas':
        return <RegistroVentas />;
      case 'gastos':
        return <GastosOperativos />;
      case 'nomina':
        return <NominaSueldos />;
      case 'proveedores':
        return <DirectorioProveedores />;
      case 'usuarios':
        return <AdministracionUsuarios />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="menu" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoFood}>
              Food<Text style={styles.logoErp}>ERP</Text>
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Indicador "En línea" */}
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>En línea</Text>
          </View>

          {/* Avatar + Nombre */}
          <TouchableOpacity
            style={styles.userPill}
            onPress={() => setActiveModule('usuarios')}
            activeOpacity={0.8}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user?.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Botón Cerrar Sesión */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setLogoutConfirmOpen(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Nombre del módulo activo ──────────────────────────────────────────── */}
      <View style={styles.moduleTitleBar}>
        <MaterialCommunityIcons name={currentModule.icon} size={15} color="#76B900" />
        <Text style={styles.moduleTitleText}>{currentModule.name}</Text>
        {user?.nombre_negocio ? (
          <Text style={styles.negocioText} numberOfLines={1}>
            • {user.nombre_negocio}
          </Text>
        ) : null}
      </View>

      {/* ── Barra horizontal de módulos ───────────────────────────────────────── */}
      <View style={styles.modulesBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modulesBarScroll}
        >
          {MODULES.map((m) => {
            const isActive = m.id === activeModule;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.moduleChip, isActive && styles.moduleChipActive]}
                onPress={() => handleSelectModule(m.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={m.icon}
                  size={16}
                  color={isActive ? '#76B900' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.moduleChipText,
                    isActive && styles.moduleChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {m.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Contenido del módulo activo ───────────────────────────────────────── */}
      <View style={styles.contentContainer}>{renderModuleContent()}</View>

      {/* ── Drawer / Menú lateral ─────────────────────────────────────────────── */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />
          <View style={styles.drawerCard}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerTitle}>
                  Food<Text style={styles.logoErp}>ERP</Text>
                </Text>
                <Text style={styles.drawerSubtitle}>Módulos del Sistema</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDrawerOpen(false)}
                style={styles.drawerCloseButton}
              >
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Info del usuario en el drawer */}
            <View style={styles.drawerUser}>
              <View style={styles.drawerUserAvatar}>
                <Text style={styles.drawerUserAvatarText}>
                  {user?.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerUserName} numberOfLines={1}>{user?.nombre_completo}</Text>
                <Text style={styles.drawerUserRole}>{user?.rol || 'Administrador'}</Text>
              </View>
            </View>

            <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
              {MODULES.map((m) => {
                const isActive = m.id === activeModule;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.drawerItem,
                      isActive && styles.drawerItemActive,
                    ]}
                    onPress={() => handleSelectModule(m.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.drawerIconBox,
                        isActive && styles.drawerIconBoxActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={m.icon}
                        size={20}
                        color={isActive ? '#76B900' : '#94a3b8'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.drawerItemText,
                        isActive && styles.drawerItemTextActive,
                      ]}
                    >
                      {m.name}
                    </Text>
                    {isActive && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="#76B900"
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Logout en el drawer */}
            <TouchableOpacity
              style={styles.drawerLogout}
              onPress={() => { setDrawerOpen(false); setLogoutConfirmOpen(true); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#f87171" />
              <Text style={styles.drawerLogoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal de confirmación de Logout ──────────────────────────────────── */}
      <Modal
        visible={logoutConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutConfirmOpen(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconBox}>
              <MaterialCommunityIcons name="logout" size={28} color="#f87171" />
            </View>
            <Text style={styles.confirmTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.confirmSubtitle}>
              Tu sesión se cerrará. Puedes volver a iniciar sesión en cualquier momento.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmBtnCancel}
                onPress={() => setLogoutConfirmOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtnLogout}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnLogoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ACCENT = '#76B900';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b1121',
  },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoFood: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  logoErp: {
    color: ACCENT,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  statusText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '600',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  userAvatarText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  // ── Module title bar ────────────────────────────────────────────────────────
  moduleTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  moduleTitleText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  negocioText: {
    color: '#64748b',
    fontSize: 11,
    flex: 1,
  },
  // ── Modules bar ─────────────────────────────────────────────────────────────
  modulesBarContainer: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 7,
  },
  modulesBarScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  moduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.4)',
  },
  moduleChipActive: {
    backgroundColor: 'rgba(118, 185, 0, 0.14)',
    borderColor: 'rgba(118, 185, 0, 0.4)',
  },
  moduleChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  moduleChipTextActive: {
    color: '#d9f99d',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  // ── Drawer ──────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalBackdrop: {
    flex: 1,
  },
  drawerCard: {
    width: 300,
    backgroundColor: '#0f172a',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  drawerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  drawerCloseButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  drawerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(118,185,0,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(118,185,0,0.2)',
    marginBottom: 14,
  },
  drawerUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerUserAvatarText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
  },
  drawerUserName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerUserRole: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  drawerList: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 3,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(118, 185, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(118, 185, 0, 0.3)',
  },
  drawerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerIconBoxActive: {
    backgroundColor: 'rgba(118, 185, 0, 0.2)',
  },
  drawerItemText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    flex: 1,
  },
  drawerItemTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  drawerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    marginTop: 10,
  },
  drawerLogoutText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },
  // ── Logout confirm modal ─────────────────────────────────────────────────────
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  confirmIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  confirmBtnCancelText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtnLogout: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.9)',
    alignItems: 'center',
  },
  confirmBtnLogoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
