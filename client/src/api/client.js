/**
 * FuelTrack AI — Centralized API Client
 * All calls proxy through Vite to http://localhost:8000/api
 */

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.detail || `Request failed: ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

/* ── Users & Auth ───────────────────────────────────── */
export const api = {
  users: {
    list:   ()            => request('/users/'),
    create: (body)        => request('/users/', { method: 'POST', body }),
    login:  (body)        => request('/users/auth/login', { method: 'POST', body }),
  },

  /* ── Vehicles ─────────────────────────────────────── */
  vehicles: {
    list:   (userId)      => request(`/vehicles/${userId ? `?user_id=${userId}` : ''}`),
    get:    (id)          => request(`/vehicles/${id}`),
    create: (body)        => request('/vehicles/', { method: 'POST', body }),
    update: (id, body)    => request(`/vehicles/${id}`, { method: 'PUT', body }),
    delete: (id)          => request(`/vehicles/${id}`, { method: 'DELETE' }),
  },

  /* ── Fuel Logs ────────────────────────────────────── */
  fuelLogs: {
    list:   (vid)         => request(`/vehicles/${vid}/fuel-logs/`),
    get:    (vid, lid)    => request(`/vehicles/${vid}/fuel-logs/${lid}`),
    create: (vid, body)   => request(`/vehicles/${vid}/fuel-logs/`, { method: 'POST', body }),
    update: (vid, lid, b) => request(`/vehicles/${vid}/fuel-logs/${lid}`, { method: 'PUT', body: b }),
    delete: (vid, lid)    => request(`/vehicles/${vid}/fuel-logs/${lid}`, { method: 'DELETE' }),
  },

  /* ── Expenses ─────────────────────────────────────── */
  expenses: {
    list:   (vid, cat)    => request(`/vehicles/${vid}/expenses/${cat ? `?category=${cat}` : ''}`),
    get:    (vid, eid)    => request(`/vehicles/${vid}/expenses/${eid}`),
    create: (vid, body)   => request(`/vehicles/${vid}/expenses/`, { method: 'POST', body }),
    update: (vid, eid, b) => request(`/vehicles/${vid}/expenses/${eid}`, { method: 'PUT', body: b }),
    delete: (vid, eid)    => request(`/vehicles/${vid}/expenses/${eid}`, { method: 'DELETE' }),
  },

  /* ── Stats ────────────────────────────────────────── */
  stats: {
    overview: (vid, timeframe) => request(`/vehicles/${vid}/stats/${timeframe ? `?timeframe=${timeframe}` : ''}`),
    monthly:  (vid)       => request(`/vehicles/${vid}/stats/monthly`),
  },

  /* ── Health ───────────────────────────────────────── */
  health: () => request('/health'),
};
