import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  nombre_completo: string;
  nombre_negocio?: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user: User }>;
  register: (data: {
    nombre_completo: string;
    nombre_negocio: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string; user: User }>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User & { password?: string }>) => Promise<{ success: boolean; message: string; user: User }>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'fooderp_token';
const USER_KEY = 'fooderp_user';

let inMemoryToken: string | null = null;

// Interceptor global para que todos los fetch en el móvil lleven el token Bearer automáticamente
if (typeof globalThis !== 'undefined' && !(globalThis as any).__fooderp_fetch_intercepted__) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args: any[]) => {
    let [resource, config] = args;
    const token = inMemoryToken || (await AsyncStorage.getItem(TOKEN_KEY));

    if (token && typeof resource === 'string' && resource.includes(':3000/api')) {
      config = config || {};
      const headers = new Headers(config.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      config.headers = headers;
    }

    return (originalFetch as any)(resource, config);
  };
  (globalThis as any).__fooderp_fetch_intercepted__ = true;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Cargar sesión guardada al iniciar la app
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedToken && savedUser) {
          inMemoryToken = savedToken;
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Error al cargar sesión guardada:', e);
      } finally {
        setInitialized(true);
      }
    };
    loadSession();
  }, []);

  // Helper para hacer peticiones con el token Bearer
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      inMemoryToken = data.token;
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, message: data.message, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  // ── Registro ───────────────────────────────────────────────────────────────
  const register = async ({
    nombre_completo,
    nombre_negocio,
    email,
    password,
  }: {
    nombre_completo: string;
    nombre_negocio: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo, nombre_negocio, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar la cuenta');
      }
      inMemoryToken = data.token;
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, message: data.message, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  // ── Cerrar Sesión ──────────────────────────────────────────────────────────
  const logout = async () => {
    inMemoryToken = null;
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  // ── Actualizar Perfil ──────────────────────────────────────────────────────
  const updateProfile = async (profileData: Partial<User & { password?: string }>) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar perfil');
      }
      if (data.token) {
        inMemoryToken = data.token;
        setToken(data.token);
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.user) {
        setUser(data.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
      return { success: true, message: data.message, user: data.user };
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) return null; // Esperar a cargar AsyncStorage antes de renderizar

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

