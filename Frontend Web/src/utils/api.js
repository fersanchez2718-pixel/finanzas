const configuredApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');

export const API_BASE = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl}/api`;
