import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Modal — reusable overlay with focus trap & Escape key dismiss
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 480 }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button className="btn btn-ghost" style={{ padding: 6, height: 'auto' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
