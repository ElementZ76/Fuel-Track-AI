import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, BarChart2, Settings,
  HelpCircle, RefreshCw, ChevronDown, Plus, Pencil, Trash2, Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import Avatar from './Avatar';
import Modal from './Modal';

const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric'];

/* ─── Add / Edit Vehicle Modal ──────────────────────── */
function VehicleFormModal({ isOpen, onClose, onSaved, initial = null, userId = null }) {
  const { showToast } = useApp();
  const isEdit = !!initial;
  const defaultForm = {
    name: '', make: '', model: '', year: '',
    fuel_type: 'petrol', plate: '', tank_capacity: '',
    initial_odometer: '0', notes: '',
  };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        make: initial.make || '',
        model: initial.model || '',
        year: initial.year || '',
        fuel_type: initial.fuel_type || 'petrol',
        plate: initial.plate || '',
        tank_capacity: initial.tank_capacity || '',
        initial_odometer: initial.initial_odometer ?? '0',
        notes: initial.notes || '',
      });
    } else {
      setForm(defaultForm);
    }
  }, [initial, isOpen]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return showToast('Vehicle name is required', 'error');
    setSaving(true);
    try {
      const payload = {
        ...form,
        year: form.year ? Number(form.year) : null,
        tank_capacity: form.tank_capacity ? Number(form.tank_capacity) : null,
        initial_odometer: Number(form.initial_odometer) || 0,
      };
      let result;
      if (isEdit) {
        result = await api.vehicles.update(initial.id, payload);
      } else {
        result = await api.vehicles.create({ ...payload, user_id: userId });
      }
      showToast(isEdit ? 'Vehicle updated!' : 'Vehicle added!', 'success');
      onSaved(result);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Vehicle' : 'Add New Vehicle'} maxWidth={540}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div>
          <label className="input-label">Vehicle Name *</label>
          <input className="input" placeholder="e.g. My Honda City" value={form.name} onChange={set('name')} required />
        </div>

        {/* Make + Model */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Make</label>
            <input className="input" placeholder="Honda" value={form.make} onChange={set('make')} />
          </div>
          <div>
            <label className="input-label">Model</label>
            <input className="input" placeholder="City" value={form.model} onChange={set('model')} />
          </div>
        </div>

        {/* Year + Plate */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Year</label>
            <input className="input" type="number" placeholder="2022" min="1900" max="2100" value={form.year} onChange={set('year')} />
          </div>
          <div>
            <label className="input-label">License Plate</label>
            <input className="input" placeholder="KA01AB1234" value={form.plate} onChange={set('plate')} style={{ textTransform: 'uppercase' }} />
          </div>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="input-label">Fuel Type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {FUEL_TYPES.map(ft => (
              <button
                key={ft} type="button"
                onClick={() => setForm(f => ({ ...f, fuel_type: ft }))}
                className={`tab-item ${form.fuel_type === ft ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center', padding: '7px 0' }}
              >
                {ft.charAt(0).toUpperCase() + ft.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tank + Odometer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Tank Capacity (L)</label>
            <input className="input" type="number" step="0.1" placeholder="40.0" value={form.tank_capacity} onChange={set('tank_capacity')} />
          </div>
          <div>
            <label className="input-label">Initial Odometer (km)</label>
            <input className="input" type="number" step="0.1" placeholder="0" value={form.initial_odometer} onChange={set('initial_odometer')} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="input-label">Notes (optional)</label>
          <textarea className="input" placeholder="Any notes about this vehicle..." value={form.notes} onChange={set('notes')} style={{ minHeight: 64 }} />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 4, height: 44, fontSize: 15 }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Switch Vehicle Modal ───────────────────────────── */
export function SwitchVehicleModal({ isOpen, onClose }) {
  const { user, vehicle: activeVehicle, selectVehicle, showToast } = useApp();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.vehicles.list(user.id);
      setVehicles(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  async function handleDelete(v) {
    try {
      await api.vehicles.delete(v.id);
      showToast(`${v.name} deleted`, 'warning');
      if (activeVehicle?.id === v.id) selectVehicle(null);
      setConfirmDelete(null);
      load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleSelect(v) {
    selectVehicle(v);
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Switch Vehicle" maxWidth={460}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>No vehicles yet. Add your first one!</p>
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add Vehicle
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vehicles.map(v => (
              <div
                key={v.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${activeVehicle?.id === v.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: activeVehicle?.id === v.id ? 'var(--color-primary-subtle)' : 'var(--color-bg-elevated)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                onClick={() => handleSelect(v)}
              >
                <Avatar name={v.name} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {[v.make, v.model, v.year].filter(Boolean).join(' ')}
                    {v.plate && ` • ${v.plate}`}
                  </div>
                </div>
                {activeVehicle?.id === v.id && <Check size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                <button className="btn btn-ghost" style={{ padding: 6 }}
                  onClick={e => { e.stopPropagation(); setEditTarget(v); }}>
                  <Pencil size={13} />
                </button>
                <button className="btn btn-ghost" style={{ padding: 6, color: 'var(--color-error)' }}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(v); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => setAddOpen(true)} style={{ marginTop: 8 }}>
              <Plus size={14} /> Add New Vehicle
            </button>
          </div>
        )}

        {/* Delete confirm */}
        {confirmDelete && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 'var(--radius-md)',
            background: 'var(--color-error-dim)', border: '1px solid rgba(248,113,113,0.25)'
          }}>
            <p style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 12 }}>
              Delete <strong>{confirmDelete.name}</strong>? This will remove ALL fuel logs and expenses for this vehicle. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>Delete</button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      <VehicleFormModal
        isOpen={addOpen || !!editTarget}
        onClose={() => { setAddOpen(false); setEditTarget(null); }}
        initial={editTarget}
        userId={user?.id}
        onSaved={() => load()}
      />
    </>
  );
}

/* ─── Sidebar ────────────────────────────────────────── */
export default function AppLayout({ children }) {
  const { user, vehicle, logout } = useApp();
  const [switchOpen, setSwitchOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navItems = [
    { to: '/dashboard',   icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/expenditure', icon: <Wallet size={16} />,          label: 'Expenditure' },
    { to: '/analysis',    icon: <BarChart2 size={16} />,       label: 'Analysis' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-headline)'
            }}>F</div>
            <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
              FuelTrack AI
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', paddingLeft: 36 }}>Fleet Precision</p>
        </div>

        {/* Active vehicle */}
        {vehicle && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Active Vehicle</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', truncate: true, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {vehicle.name}
            </p>
            {vehicle.plate && <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{vehicle.plate}</p>}
          </div>
        )}

        {/* Switch Vehicle */}
        <div style={{ padding: '10px 8px' }}>
          <button
            className="btn btn-outlined"
            style={{ width: '100%', fontSize: 13 }}
            onClick={() => setSwitchOpen(true)}
          >
            <RefreshCw size={13} /> Switch Vehicle
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '4px 0' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px 0' }}>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={16} /> Settings
          </NavLink>
          <NavLink to="/support" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <HelpCircle size={16} /> Support
          </NavLink>
        </div>

        {/* User profile */}
        <div
          style={{
            padding: '12px 16px', borderTop: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
          }}
          onClick={handleLogout}
          title="Click to log out"
        >
          <Avatar name={user?.display_name || user?.username || '?'} size={30} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.display_name || user?.username}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Click to log out</p>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--color-bg-base)' }}>
        {children}
      </main>

      {/* ── Modals ── */}
      <SwitchVehicleModal isOpen={switchOpen} onClose={() => setSwitchOpen(false)} />
    </div>
  );
}
