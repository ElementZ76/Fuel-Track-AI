import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import ToastContainer from './components/ToastContainer';
import AppLayout from './components/AppLayout';

import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import ExpenditurePage  from './pages/ExpenditurePage';
import AnalysisPage     from './pages/AnalysisPage';
import FuelLogListPage  from './pages/FuelLogListPage';
import SettingsPage     from './pages/SettingsPage';
import SupportPage      from './pages/SupportPage';

/* ─── Protected Route wrapper ────────────────────────── */
function Protected({ children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<LoginPage />} />
      <Route path="/dashboard"   element={<Protected><DashboardPage /></Protected>} />
      <Route path="/expenditure" element={<Protected><ExpenditurePage /></Protected>} />
      <Route path="/analysis"    element={<Protected><AnalysisPage /></Protected>} />
      <Route path="/logs"        element={<Protected><FuelLogListPage /></Protected>} />
      <Route path="/settings"    element={<Protected><SettingsPage /></Protected>} />
      <Route path="/support"     element={<Protected><SupportPage /></Protected>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
