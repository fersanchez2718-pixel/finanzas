import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  enqueueMutation,
  setCachedResponse,
  getCachedResponse,
  getOfflineQueue,
  syncOfflineQueue,
  initOfflineSyncListeners
} from '../utils/offlineSync';

const AuthContext = createContext();

const API_BASE = 'http://localhost:3000/api';

// Iniciar listeners offline globales
if (typeof window !== 'undefined') {
  initOfflineSyncListeners();
}

// Interceptor global para token Bearer + Soporte Offline (Cache GET + Cola Mutaciones)
if (typeof window !== 'undefined' && !window.__fooderp_fetch_intercepted__) {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    config = config || {};

    // Si viene marcado internamente para no re-interceptar
    if (config.__skipOfflineInterceptor) {
      delete config.__skipOfflineInterceptor;
      return originalFetch(resource, config);
    }

    const token = localStorage.getItem('fooderp_token');
    const isApiCall = typeof resource === 'string' && resource.includes(':3000/api');

    if (token && isApiCall) {
      const headers = new Headers(config.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      config.headers = headers;
    }

    const method = (config.method || 'GET').toUpperCase();

    // 1. Manejo de peticiones de lectura (GET): Cachear o responder de caché si no hay red
    if (isApiCall && method === 'GET') {
      try {
        if (!navigator.onLine) {
          const cached = getCachedResponse(resource);
          if (cached) {
            return new Response(JSON.stringify(cached), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'X-FoodERP-Offline': 'true' }
            });
          }
        }

        const response = await originalFetch(resource, config);
        if (response.ok) {
          try {
            const clone = response.clone();
            const data = await clone.json();
            setCachedResponse(resource, data);
          } catch (e) {}
        }
        return response;
      } catch (networkError) {
        // En caso de que la conexión esté caída o backend temporalmente inaccesible
        const cached = getCachedResponse(resource);
        if (cached) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-FoodERP-Offline': 'true' }
          });
        }
        throw networkError;
      }
    }

    // 2. Manejo de mutaciones (POST, PUT, DELETE): Si no hay red, guardar en cola offline
    if (isApiCall && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
      const isAuthCall = resource.includes('/auth/login') || resource.includes('/auth/register');

      if (!isAuthCall) {
        if (!navigator.onLine) {
          const headerObj = {};
          if (config.headers instanceof Headers) {
            config.headers.forEach((v, k) => { headerObj[k] = v; });
          } else if (config.headers) {
            Object.assign(headerObj, config.headers);
          }

          enqueueMutation({
            url: resource,
            method,
            headers: headerObj,
            body: config.body
          });

          return new Response(JSON.stringify({
            success: true,
            offline: true,
            message: 'Operación guardada localmente en tu dispositivo. Se sincronizará automáticamente al recuperar conexión.'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        try {
          const response = await originalFetch(resource, config);
          return response;
        } catch (networkError) {
          // Falla de red: encolar para no perder los datos del usuario
          const headerObj = {};
          if (config.headers instanceof Headers) {
            config.headers.forEach((v, k) => { headerObj[k] = v; });
          } else if (config.headers) {
            Object.assign(headerObj, config.headers);
          }

          enqueueMutation({
            url: resource,
            method,
            headers: headerObj,
            body: config.body
          });

          return new Response(JSON.stringify({
            success: true,
            offline: true,
            message: 'Operación guardada localmente en tu dispositivo. Se sincronizará automáticamente al recuperar conexión.'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    return originalFetch(resource, config);
  };
  window.__fooderp_fetch_intercepted__ = true;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fooderp_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fooderp_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Estados de conectividad y sincronización offline
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(() => getOfflineQueue().length);
  const [syncToast, setSyncToast] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleQueueChange = (e) => {
      setPendingOfflineCount(e.detail?.count ?? getOfflineQueue().length);
    };

    const handleSynced = (e) => {
      const count = e.detail?.count || 0;
      setPendingOfflineCount(getOfflineQueue().length);
      if (count > 0) {
        setSyncToast(`¡Conexión restablecida! ${count} cambio(s) sincronizados con la nube`);
        setTimeout(() => setSyncToast(null), 4500);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('fooderp:offline-queue-changed', handleQueueChange);
    window.addEventListener('fooderp:synced', handleSynced);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fooderp:offline-queue-changed', handleQueueChange);
      window.removeEventListener('fooderp:synced', handleSynced);
    };
  }, []);

  // Iniciar sesión con email y password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('fooderp_token', data.token);
      localStorage.setItem('fooderp_user', JSON.stringify(data.user));

      return { success: true, message: data.message, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  // Registrar nueva cuenta (comienza en ceros, rol Administrador por defecto)
  const register = async ({ nombre_completo, nombre_negocio, email, password }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo, nombre_negocio, email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar la cuenta');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('fooderp_token', data.token);
      localStorage.setItem('fooderp_user', JSON.stringify(data.user));

      return { success: true, message: data.message, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fooderp_token');
    localStorage.removeItem('fooderp_user');
  };

  // Actualizar perfil del usuario activo (nombre, negocio, correo, contraseña o tema)
  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar perfil');
      }

      if (data.token) {
        setToken(data.token);
        localStorage.setItem('fooderp_token', data.token);
      }
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('fooderp_user', JSON.stringify(data.user));
      }

      return { success: true, message: data.message, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  const syncNow = async () => {
    return await syncOfflineQueue();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isOnline,
        pendingOfflineCount,
        syncNow,
        syncToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
