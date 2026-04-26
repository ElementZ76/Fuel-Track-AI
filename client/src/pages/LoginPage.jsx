import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete, Plus, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

/* ─── Register New User Modal ────────────────────────── */
function RegisterModal({ isOpen, onClose, onCreated }) {
  const { showToast } = useApp();
  const [form, setForm] = useState({ username: '', display_name: '', pin: '', pin2: '' });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.pin !== form.pin2) return showToast('PINs do not match', 'error');
    if (!/^\d{4}$/.test(form.pin)) return showToast('PIN must be exactly 4 digits', 'error');
    setSaving(true);
    try {
      const user = await api.users.create({
        username: form.username.trim().toLowerCase(),
        pin: form.pin,
        display_name: form.display_name.trim() || undefined,
      });
      showToast(`Welcome, ${user.display_name || user.username}!`, 'success');
      onCreated(user);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Profile">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="input-label">Username *</label>
          <input className="input" placeholder="e.g. praveen" value={form.username} onChange={set('username')} required />
        </div>
        <div>
          <label className="input-label">Display Name</label>
          <input className="input" placeholder="Praveen Kumar" value={form.display_name} onChange={set('display_name')} />
        </div>
        <div>
          <label className="input-label">4-Digit PIN *</label>
          <input className="input" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={form.pin} onChange={set('pin')} required />
        </div>
        <div>
          <label className="input-label">Confirm PIN *</label>
          <input className="input" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={form.pin2} onChange={set('pin2')} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: 44, marginTop: 4 }}>
          {saving ? 'Creating…' : 'Create Profile'}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Login Page ─────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, showToast, user } = useApp();

  const [users, setUsers]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [pin, setPin]             = useState('');
  const [error, setError]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const pinRowRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  async function loadUsers() {
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch {
      showToast('Could not reach the backend. Is it running?', 'error');
    }
  }
  useEffect(() => { loadUsers(); }, []);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && selected) handleLogin();
  }, [pin]);

  function handleDigit(d) {
    if (pin.length >= 4) return;
    setError(false);
    setPin(p => p + d);
  }

  function handleClear() { setPin(''); setError(false); }
  function handleBackspace() { setPin(p => p.slice(0, -1)); setError(false); }

  function selectUser(u) {
    setSelected(u);
    setPin('');
    setError(false);
  }

  async function handleLogin() {
    if (!selected || pin.length !== 4) return;
    setLoading(true);
    try {
      const resp = await api.users.login({ username: selected.username, pin });
      if (resp.success) {
        login(resp.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(true);
      setPin('');
      if (pinRowRef.current) {
        pinRowRef.current.classList.add('shake');
        setTimeout(() => pinRowRef.current?.classList.remove('shake'), 500);
      }
    } finally {
      setLoading(false);
    }
  }

  const DIGITS = ['1','2','3','4','5','6','7','8','9'];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(128,105,191,0.12) 0%, transparent 60%)',
    }}>
      {/* Card */}
      <div style={{
        width: 360, background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-headline)'
            }}>F</div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              FuelTrack AI
            </h1>
          </div>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            Select Operator Profile
          </p>
        </div>

        {/* User Switcher */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10 }}>
            Recent Operators
          </p>

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="tab-scroll">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => selectUser(u)}
                style={{
                  flexShrink: 0, width: 88, padding: '12px 8px',
                  borderRadius: 'var(--radius-md)', textAlign: 'center',
                  border: `1px solid ${selected?.id === u.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: selected?.id === u.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-elevated)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Avatar name={u.display_name || u.username} size={40} className="mx-auto" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.display_name || u.username}
                </p>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  @{u.username}
                </p>
              </div>
            ))}

            {/* Add New User card */}
            <div
              onClick={() => setRegisterOpen(true)}
              style={{
                flexShrink: 0, width: 88, padding: '12px 8px',
                borderRadius: 'var(--radius-md)', textAlign: 'center',
                border: '1px dashed var(--color-border)',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: 'var(--color-text-muted)', transition: 'all 0.15s ease', minHeight: 88,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-overlay)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Plus size={14} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 500 }}>New User</p>
            </div>
          </div>
        </div>

        {/* PIN Area */}
        {selected && (
          <div style={{ padding: '0 20px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 12 }}>
              Enter PIN for <strong style={{ color: 'var(--color-text-primary)' }}>{selected.display_name || selected.username}</strong>
            </p>

            {/* PIN dots */}
            <div ref={pinRowRef} style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              {[0,1,2,3].map(i => (
                <div key={i} className={`pin-dot ${pin.length > i ? (error ? 'error' : 'filled') : ''}`} />
              ))}
            </div>

            {error && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-error)', marginBottom: 12, marginTop: -12 }}>
                Incorrect PIN. Try again.
              </p>
            )}

            {/* Number Pad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {DIGITS.map(d => (
                <button key={d} className="pin-btn" onClick={() => handleDigit(d)} disabled={loading}>
                  {d}
                </button>
              ))}
              <button className="pin-btn" onClick={handleClear} disabled={loading}
                style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                CLEAR
              </button>
              <button className="pin-btn" onClick={() => handleDigit('0')} disabled={loading}>0</button>
              <button className="pin-btn" onClick={handleBackspace} disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Delete size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', padding: '12px 20px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <a href="/support" style={{ fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Support <ChevronRight size={11} />
          </a>
        </div>
      </div>

      {/* Register Modal */}
      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onCreated={(u) => { loadUsers(); selectUser(u); }}
      />
    </div>
  );
}
