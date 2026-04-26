import { createContext, useContext, useState, useCallback } from 'react';

/* ─────────────────────────────────────────────────────
   App Context — lightweight global state
   No Redux, no Zustand — just Context + useState
───────────────────────────────────────────────────── */

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser]           = useState(() => {
    const stored = sessionStorage.getItem('ft_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [vehicle, setVehicle]     = useState(() => {
    const stored = sessionStorage.getItem('ft_vehicle');
    return stored ? JSON.parse(stored) : null;
  });

  const [toasts, setToasts]       = useState([]);

  /* ── Auth helpers ─────────────────────────────────── */
  const login = useCallback((userData) => {
    setUser(userData);
    sessionStorage.setItem('ft_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setVehicle(null);
    sessionStorage.removeItem('ft_user');
    sessionStorage.removeItem('ft_vehicle');
  }, []);

  /* ── Vehicle helpers ──────────────────────────────── */
  const selectVehicle = useCallback((v) => {
    setVehicle(v);
    sessionStorage.setItem('ft_vehicle', JSON.stringify(v));
  }, []);

  /* ── Toast helpers ────────────────────────────────── */
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      vehicle, selectVehicle,
      toasts, showToast, dismissToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
