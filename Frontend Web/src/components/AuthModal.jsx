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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const { login, register, loading } = useAuth();
  const { isDark } = useTheme();

  const [tab, setTab] = useState(defaultTab); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreNegocio, setNombreNegocio] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (tab === 'login') {
        const res = await login(email, password);
        setSuccess(res.message);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const res = await register({
          nombre_completo: nombreCompleto,
          nombre_negocio: nombreNegocio,
          email,
          password
        });
        setSuccess('¡Cuenta creada exitosamente! Tu entorno se ha inicializado en ceros.');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar tu solicitud');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setEmail('fernandoramirez@gmail.com');
    setPassword('Admin123!');
    try {
      const res = await login('fernandoramirez@gmail.com', 'Admin123!');
      setSuccess('Sesión iniciada con la cuenta principal de Fernando Ramírez.');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión con la cuenta demo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animation-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border transition-all duration-300 overflow-hidden relative ${
          isDark
            ? 'bg-[#0e141f] border-[#76B900]/30 text-slate-100 shadow-[0_0_50px_rgba(118,185,0,0.15)]'
            : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
        }`}
      >
        {/* Cabecera con Acento NVIDIA */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/5 bg-gradient-to-r from-emerald-950/30 via-transparent to-transparent">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-[#76B900] shadow-[0_0_10px_#76B900]" />
            <span className="font-extrabold text-sm tracking-wider uppercase text-[#76B900]">
              FoodERP Cloud
            </span>
          </div>

          <h2 className="text-2xl font-bold">
            {tab === 'login' ? 'Iniciar Sesión' : 'Crear Nueva Cuenta'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tab === 'login'
              ? 'Accede a tu panel financiero y administrativo'
              : 'Empieza con un espacio independiente en ceros'}
          </p>

          {/* Selector de Pestañas */}
          <div className="flex mt-4 p-1 rounded-xl bg-black/30 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-[#76B900] text-black shadow-[0_0_12px_rgba(118,185,0,0.35)]'
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
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'register'
                  ? 'bg-[#76B900] text-black shadow-[0_0_12px_rgba(118,185,0,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Mensajes de Notificación */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="Ej. Carlos Martínez"
                    className="w-full pl-9 pr-3 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Nombre del Negocio / Restaurante
                </label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={nombreNegocio}
                    onChange={(e) => setNombreNegocio(e.target.value)}
                    placeholder="Ej. Taquería El Pastor / Burger House"
                    className="w-full pl-9 pr-3 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@negocio.com"
                className="w-full pl-9 pr-3 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">
              Contraseña *
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-10 py-2.5 bg-black/25 border border-slate-700/60 rounded-xl text-sm focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="p-3 rounded-xl bg-[#76B900]/10 border border-[#76B900]/25 text-xs text-slate-300 flex items-start gap-2">
              <ShieldCheck size={18} className="text-[#76B900] shrink-0 mt-0.5" />
              <span>
                <strong>Aislamiento total:</strong> Tu cuenta iniciará completamente en <strong>ceros</strong> sin datos compartidos con otros usuarios.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#76B900] hover:bg-[#86CE00] text-black shadow-[0_0_20px_rgba(118,185,0,0.35)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'login' ? 'Entrar al Sistema' : 'Crear mi Cuenta en Ceros'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Acceso Rápido a Cuenta Demo (Fernando Ramírez) */}
        {tab === 'login' && (
          <div className="px-6 pb-6 pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-700/50"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">O también</span>
              <div className="flex-grow border-t border-slate-700/50"></div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-700 hover:border-[#76B900]/60 bg-slate-900/40 hover:bg-slate-800/60 text-slate-200 transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles size={14} className="text-[#76B900] group-hover:scale-110 transition-transform" />
              <span>Ingresar como Administrador Demo (Fernando Ramírez)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
