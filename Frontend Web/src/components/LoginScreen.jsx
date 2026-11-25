import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Lock,
  Mail,
  User,
  Store,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

export default function LoginScreen() {
  const { login, register, loading } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        setSuccess(res.message);
      } else {
        const res = await register({
          nombre_completo: nombreCompleto,
          nombre_negocio: nombreNegocio,
          email,
          password
        });
        setSuccess('¡Cuenta creada exitosamente! Tu entorno se ha inicializado en ceros.');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar tu solicitud');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#76B900]/5 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[140px]" />
      </div>

      {/* Botón de cambio de tema en la esquina superior */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-3 rounded-2xl border border-slate-700/60 hover:border-[#76B900]/60 bg-slate-900/40 hover:bg-slate-800 text-slate-300 hover:text-[#76B900] transition-all cursor-pointer shadow-lg"
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl border transition-all duration-300 overflow-hidden relative z-10 ${
          isDark
            ? 'bg-[#0e141f] border-[#76B900]/30 text-slate-100 shadow-[0_0_50px_rgba(118,185,0,0.15)]'
            : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
        }`}
      >
        {/* Cabecera de la Ventana de Acceso */}
        <div className="px-6 sm:px-8 pt-7 pb-4 border-b border-white/5 bg-gradient-to-r from-emerald-950/20 via-transparent to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#76B900] shadow-[0_0_10px_#76B900]" />
            <span className="font-black text-xl tracking-tight">
              Food<span className="text-[#76B900]">ERP</span>
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight">
            {tab === 'login' ? 'Iniciar Sesión' : 'Crear Nueva Cuenta'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {tab === 'login'
              ? 'Accede a tu panel de control y finanzas'
              : 'Registra tu restaurante e inicia con un espacio en ceros'}
          </p>

          {/* Selector de Pestañas: Iniciar Sesión / Registrarse */}
          <div className="flex mt-5 p-1 rounded-xl bg-black/30 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#76B900] text-black shadow-[0_0_15px_rgba(118,185,0,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-[#76B900] text-black shadow-[0_0_15px_rgba(118,185,0,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Mensajes de Notificación */}
        {error && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle size={17} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 sm:mx-8 mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-300">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Carlos Martínez"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-300">
                  Nombre del Negocio / Restaurante
                </label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={nombreNegocio}
                    onChange={(e) => setNombreNegocio(e.target.value)}
                    placeholder="Ej. Taquería El Pastor / Burger House"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-300">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@negocio.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-slate-300">
              Contraseña *
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="p-3.5 rounded-xl bg-[#76B900]/10 border border-[#76B900]/25 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-[#76B900] shrink-0 mt-0.5" />
              <span>
                <strong>Aislamiento total:</strong> Tu cuenta iniciará completamente en <strong>ceros</strong> sin datos compartidos con otros usuarios.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#76B900] hover:bg-[#86CE00] text-black shadow-[0_0_20px_rgba(118,185,0,0.35)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'login' ? 'Entrar al Sistema' : 'Crear mi Cuenta en Ceros'}</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
