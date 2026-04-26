import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {ICONS[t.type]}
          <span style={{ flex: 1, color: 'var(--color-text-primary)', fontSize: 13 }}>
            {t.message}
          </span>
          <button
            className="btn-ghost"
            style={{ padding: '2px', height: 'auto', minWidth: 'auto' }}
            onClick={() => dismissToast(t.id)}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
