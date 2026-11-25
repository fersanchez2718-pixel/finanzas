// ========================================================
// FoodERP Offline Sync Engine & Cache Manager
// Permite operar sin conexión a red y sincronizar al volver
// ========================================================

const QUEUE_KEY = 'fooderp_offline_mutations';
const CACHE_PREFIX = 'fooderp_cache_';

// Obtener cola de mutaciones pendientes
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Guardar cola
function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('fooderp:offline-queue-changed', {
      detail: { count: queue.length }
    }));
  } catch (e) {
    console.error('Error al guardar cola offline:', e);
  }
}

// Agregar mutación pendiente
export function enqueueMutation({ url, method, headers, body, description }) {
  const queue = getOfflineQueue();
  const item = {
    id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    url,
    method,
    headers: headers || {},
    body: typeof body === 'string' ? body : JSON.stringify(body),
    description: description || `${method} en ${url}`,
    timestamp: Date.now()
  };
  queue.push(item);
  saveOfflineQueue(queue);
  console.log(`[OfflineSync] Operación encolada para sincronización:`, item.description);
  return item;
}

// Guardar en caché de lectura (GET)
export function setCachedResponse(url, data) {
  try {
    const key = CACHE_PREFIX + url;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Si localStorage está lleno, ignorar silenciosamente
  }
}

// Leer de caché de lectura (GET)
export function getCachedResponse(url) {
  try {
    const key = CACHE_PREFIX + url;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data;
  } catch (e) {
    return null;
  }
}

let isSyncing = false;

// Sincronizar cola pendiente con el servidor cuando haya conexión
export async function syncOfflineQueue(onProgress) {
  if (isSyncing) return { inProgress: true };
  if (!navigator.onLine) return { offline: true };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { count: 0 };

  isSyncing = true;
  console.log(`[OfflineSync] Iniciando sincronización de ${queue.length} operaciones pendientes...`);

  let syncedCount = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      // Tomar token fresco de localStorage si existe
      const currentToken = localStorage.getItem('fooderp_token');
      const headers = { ...item.headers };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch(item.url, {
        method: item.method,
        headers,
        body: item.body,
        // Flag especial para no re-interceptar
        __skipOfflineInterceptor: true
      });

      if (res.ok) {
        syncedCount++;
        if (onProgress) onProgress(syncedCount, queue.length);
      } else {
        // Si el servidor rechazó por error de negocio o servidor, evaluar si mantener o descartar
        console.warn(`[OfflineSync] Servidor respondió con status ${res.status} para:`, item.url);
        // Si es 400/404/401 no tiene sentido reintentar en bucle; si es 500 o red reintentar
        if (res.status >= 500) {
          remaining.push(item);
        }
      }
    } catch (netErr) {
      console.warn(`[OfflineSync] Falla de red durante sincronización, se reintentará luego:`, netErr);
      remaining.push(item);
      break; // Detener reintentos si la red se volvió a caer
    }
  }

  saveOfflineQueue(remaining);
  isSyncing = false;

  if (syncedCount > 0) {
    console.log(`[OfflineSync] ✓ ${syncedCount} operaciones sincronizadas con éxito.`);
    window.dispatchEvent(new CustomEvent('fooderp:synced', {
      detail: { count: syncedCount, remaining: remaining.length }
    }));
  }

  return { count: syncedCount, remaining: remaining.length };
}

// Iniciar monitoreo automático de conectividad
export function initOfflineSyncListeners() {
  if (typeof window === 'undefined') return;

  // Sincronizar al recuperar internet
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Conexión de red detectada (online). Sincronizando cambios...');
    setTimeout(() => {
      syncOfflineQueue();
    }, 1500);
  });

  // Reintento periódico cada 20 segundos si hay operaciones pendientes y hay internet
  setInterval(() => {
    if (navigator.onLine && getOfflineQueue().length > 0 && !isSyncing) {
      syncOfflineQueue();
    }
  }, 20000);
}
