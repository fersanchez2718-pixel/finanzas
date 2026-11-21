import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = 'http://localhost:3000/api';

// Interceptor global para que todos los fetches lleven el token Bearer automáticamente
if (typeof window !== 'undefined' && !window.__fooderp_fetch_intercepted__) {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    const token = localStorage.getItem('fooderp_token');

    if (token && typeof resource === 'string' && resource.includes(':3000/api')) {
      config = config || {};
      const headers = new Headers(config.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      config.headers = headers;
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

  // Registrar nueva cuenta (comienza en ceros)
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
        updateProfile
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
