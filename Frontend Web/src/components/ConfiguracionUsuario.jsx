import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Store,
  Mail,
  Lock,
  Palette,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
  Moon,
  Sun,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ConfiguracionUsuario() {
  const { user, updateProfile, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    nombre_negocio: '',
    email: '',
    password: '',
    confirm_password: '',
    tema_preferido: 'nvidia-dark'
  });

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        nombre_completo: user.nombre_completo || '',
        nombre_negocio: user.nombre_negocio || 'FoodERP Restaurant',
        email: user.email || '',
        password: '',
        confirm_password: '',
        tema_preferido: user.tema_preferido || theme || 'nvidia-dark'
      });
    }
  }, [user, theme]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectTheme = (selectedTheme) => {
    setFormData(prev => ({ ...prev, tema_preferido: selectedTheme }));
    setTheme(selectedTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 6) {
        showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
      if (formData.password !== formData.confirm_password) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    try {
      const payload = {
        nombre_completo: formData.nombre_completo,
        nombre_negocio: formData.nombre_negocio,
        email: formData.email,
        tema_preferido: formData.tema_preferido
      };

      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password.trim();
      }

      const res = await updateProfile(payload);
      showToast(res.message || 'Configuración guardada correctamente');
      setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
    } catch (err) {
      showToast(err.message || 'Error al actualizar configuración', 'error');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animation-fade-in pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all animation-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-600/40'
              : 'bg-emerald-950/90 text-emerald-200 border-[#76B900]/50'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={20} className="text-rose-400" /> : <CheckCircle2 size={20} className="text-[#76B900]" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cabecera del Módulo */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#76B900]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#76B900]/15 border border-[#76B900]/30 text-[#76B900] flex items-center justify-center shadow-[0_0_20px_rgba(118,185,0,0.2)]">
            <User size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Configuración de Cuenta</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#76B900]/20 text-[#76B900] border border-[#76B900]/30">
                Personalización
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Administra tus datos de perfil, nombre comercial del restaurante y el tema visual del sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <Shield size={14} className="text-[#76B900]" />
          <span>Cuenta Privada y Segura</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Datos del Perfil y Restaurante */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 sm:p-7 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Store size={18} className="text-[#76B900]" />
              <span>Información General y de Negocio</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    placeholder="Tu nombre completo"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-sm text-white focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre de tu Negocio / Restaurante
                </label>
                <div className="relative">
                  <Store size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.nombre_negocio}
                    onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
                    placeholder="Ej. Hamburguesería & Grill La Estación"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-sm text-white focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico (Acceso y Notificaciones)
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-sm text-white focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all"
                />
              </div>
            </div>

            {/* Seguridad / Cambio de Contraseña */}
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3 pt-3">
              <Lock size={18} className="text-[#76B900]" />
              <span>Seguridad de la Cuenta</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nueva Contraseña (Opcional)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Dejar en blanco para conservar"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-sm text-white focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="Confirmar contraseña"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700/80 rounded-xl text-sm text-white focus:border-[#76B900] focus:ring-1 focus:ring-[#76B900] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Selector de Temas */}
          <div className="glass-panel rounded-2xl p-6 sm:p-7 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Palette size={18} className="text-[#76B900]" />
              <span>Tema Visual</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              Elige la experiencia visual que mejor se adapte a tu preferencia:
            </p>

            {/* Tarjeta Modo Oscuro */}
            <div
              onClick={() => handleSelectTheme('nvidia-dark')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-3 relative overflow-hidden ${
                formData.tema_preferido === 'nvidia-dark'
                  ? 'border-[#76B900] bg-slate-900/90 shadow-[0_0_25px_rgba(118,185,0,0.25)]'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-[#76B900]">
                    <Moon size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Modo Oscuro</h3>
                    <p className="text-[11px] text-slate-400">Fondo oscuro con acentos verdes</p>
                  </div>
                </div>
                {formData.tema_preferido === 'nvidia-dark' && (
                  <CheckCircle2 size={18} className="text-[#76B900]" />
                )}
              </div>

              {/* Preview Gráfica Dark */}
              <div className="h-14 w-full rounded-xl bg-[#080B10] border border-slate-800 p-2 flex items-center gap-2">
                <div className="w-8 h-full rounded-lg bg-[#111622] border border-[#76B900]/30" />
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  <div className="h-2 w-3/4 rounded bg-slate-700" />
                  <div className="h-2 w-1/2 rounded bg-[#76B900]" />
                </div>
              </div>
            </div>

            {/* Tarjeta Modo Claro */}
            <div
              onClick={() => handleSelectTheme('nvidia-light')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-3 relative overflow-hidden ${
                formData.tema_preferido === 'nvidia-light'
                  ? 'border-[#76B900] bg-white text-slate-900 shadow-[0_0_25px_rgba(118,185,0,0.25)]'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-[#76B900]">
                    <Sun size={16} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${formData.tema_preferido === 'nvidia-light' ? 'text-slate-900' : 'text-white'}`}>
                      Modo Claro
                    </h3>
                    <p className="text-[11px] text-slate-400">Fondo claro y alto contraste</p>
                  </div>
                </div>
                {formData.tema_preferido === 'nvidia-light' && (
                  <CheckCircle2 size={18} className="text-[#76B900]" />
                )}
              </div>

              {/* Preview Gráfica Light */}
              <div className="h-14 w-full rounded-xl bg-[#F8FAFC] border border-slate-300 p-2 flex items-center gap-2">
                <div className="w-8 h-full rounded-lg bg-white border border-slate-300 shadow-sm" />
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  <div className="h-2 w-3/4 rounded bg-slate-300" />
                  <div className="h-2 w-1/2 rounded bg-[#76B900]" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              💡 El tema seleccionado se guarda en tu cuenta y se aplicará automáticamente en todos tus dispositivos.
            </div>
          </div>
        </div>

        {/* Botón de Guardar Cambios */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl font-bold text-sm bg-[#76B900] hover:bg-[#86CE00] text-black shadow-[0_0_20px_rgba(118,185,0,0.35)] transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                <span>Guardar Cambios de Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
