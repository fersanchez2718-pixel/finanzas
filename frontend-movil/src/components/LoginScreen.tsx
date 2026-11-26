import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const { login, register, loading } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Campos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');

  const limpiarMensajes = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    limpiarMensajes();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    try {
      if (tab === 'login') {
        const res = await login(email, password);
        setSuccess(res.message || '¡Sesión iniciada correctamente!');
      } else {
        if (!nombreCompleto) {
          setError('El nombre completo es obligatorio.');
          return;
        }
        await register({ nombre_completo: nombreCompleto, nombre_negocio: nombreNegocio, email, password });
        setSuccess('¡Cuenta creada exitosamente! Tu entorno se ha inicializado en ceros.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar tu solicitud.');
    }
  };

  const handleDemoLogin = async () => {
    limpiarMensajes();
    try {
      const res = await login('fernandoramirez@gmail.com', 'Admin123!');
      setSuccess('Sesión iniciada con la cuenta de Fernando Ramírez.');
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión con la cuenta demo.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Fondo decorativo */}
      <View style={styles.bgGlow1} pointerEvents="none" />
      <View style={styles.bgGlow2} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card principal */}
          <View style={styles.card}>
            {/* Cabecera */}
            <View style={styles.cardHeader}>
              <View style={styles.logoRow}>
                <View style={styles.logoDot} />
                <Text style={styles.logoText}>
                  Food<Text style={styles.logoAccent}>ERP</Text>
                </Text>
              </View>

              <Text style={styles.cardTitle}>
                {tab === 'login' ? 'Iniciar Sesión' : 'Crear Nueva Cuenta'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {tab === 'login'
                  ? 'Accede a tu panel de control y finanzas'
                  : 'Registra tu restaurante e inicia en ceros'}
              </Text>

              {/* Selector de pestañas */}
              <View style={styles.tabSelector}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
                  onPress={() => { setTab('login'); limpiarMensajes(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
                    Iniciar Sesión
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
                  onPress={() => { setTab('register'); limpiarMensajes(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
                    Registrarse
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mensajes de error / éxito */}
            {error && (
              <View style={[styles.msgBox, styles.msgError]}>
                <Feather name="alert-triangle" size={16} color="#f87171" />
                <Text style={styles.msgErrorText}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={[styles.msgBox, styles.msgSuccess]}>
                <Feather name="check-circle" size={16} color="#34d399" />
                <Text style={styles.msgSuccessText}>{success}</Text>
              </View>
            )}

            {/* Formulario */}
            <View style={styles.form}>
              {tab === 'register' && (
                <>
                  {/* Nombre Completo */}
                  <Text style={styles.label}>Nombre Completo *</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={nombreCompleto}
                      onChangeText={setNombreCompleto}
                      placeholder="Ej. Carlos Martínez"
                      placeholderTextColor="#475569"
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Nombre del Negocio */}
                  <Text style={styles.label}>Nombre del Negocio / Restaurante</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="store-outline" size={18} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={nombreNegocio}
                      onChangeText={setNombreNegocio}
                      placeholder="Ej. Taquería El Pastor"
                      placeholderTextColor="#475569"
                      autoCapitalize="words"
                    />
                  </View>
                </>
              )}

              {/* Correo Electrónico */}
              <Text style={styles.label}>Correo Electrónico *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ejemplo@negocio.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Contraseña */}
              <Text style={styles.label}>Contraseña *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Aviso aislamiento (solo registro) */}
              {tab === 'register' && (
                <View style={styles.isolationBox}>
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color="#76B900" style={{ marginTop: 1 }} />
                  <Text style={styles.isolationText}>
                    <Text style={{ fontWeight: '700', color: '#fff' }}>Aislamiento total: </Text>
                    Tu cuenta iniciará completamente en{' '}
                    <Text style={{ fontWeight: '700', color: '#fff' }}>ceros</Text>{' '}
                    sin datos compartidos con otros usuarios.
                  </Text>
                </View>
              )}

              {/* Botón principal */}
              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnPrimaryText}>
                      {tab === 'login' ? 'Entrar al Sistema' : 'Crear mi Cuenta en Ceros'}
                    </Text>
                    <Feather name="arrow-right" size={18} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Acceso Demo */}
            {tab === 'login' && (
              <View style={styles.demoSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>O TAMBIÉN</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={[styles.btnDemo, loading && styles.btnDisabled]}
                  onPress={handleDemoLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#76B900" />
                  <Text style={styles.btnDemoText}>
                    Acceder con Cuenta Principal (Fernando Ramírez)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ACCENT = '#76B900';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#080B10',
  },
  bgGlow1: {
    position: 'absolute',
    top: '-15%',
    left: '-15%',
    width: '60%',
    height: '45%',
    borderRadius: 999,
    backgroundColor: 'rgba(118,185,0,0.05)',
    // No blur nativo en RN, es decorativo
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: '50%',
    height: '40%',
    borderRadius: 999,
    backgroundColor: 'rgba(5,150,105,0.06)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#0e141f',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(118,185,0,0.25)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(5,46,22,0.12)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: ACCENT,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#000000',
  },
  msgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  msgError: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  msgSuccess: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  msgErrorText: {
    color: '#f87171',
    fontSize: 13,
    flex: 1,
  },
  msgSuccessText: {
    color: '#34d399',
    fontSize: 13,
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.4)',
    borderRadius: 12,
    marginBottom: 2,
  },
  inputIcon: {
    marginLeft: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingRight: 14,
    color: '#ffffff',
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  isolationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(118,185,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(118,185,0,0.25)',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  isolationText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  demoSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(100,116,139,0.3)',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1,
  },
  btnDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.4)',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  btnDemoText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
});

