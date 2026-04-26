import { useState, useEffect } from 'react';
import { Fuel, Wrench, Settings, Shield, ParkingCircle, ArrowRightLeft, Sparkles, Scissors, HelpCircle, CheckCircle, Pencil, Trash2, X, Zap } from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

/* ─── Category config ────────────────────────────────── */
const CATEGORIES = [
  { key: 'fuel',        label: 'Fuel',        icon: <Fuel size={14} /> },
  { key: 'maintenance', label: 'Maintenance',  icon: <Wrench size={14} /> },
  { key: 'service',     label: 'Service',      icon: <Settings size={14} /> },
  { key: 'insurance',   label: 'Insurance',    icon: <Shield size={14} /> },
  { key: 'parking',     label: 'Parking',      icon: <ParkingCircle size={14} /> },
  { key: 'tolls',       label: 'Tolls',        icon: <ArrowRightLeft size={14} /> },
  { key: 'wash',        label: 'Wash',         icon: <Sparkles size={14} /> },
  { key: 'repairs',     label: 'Repairs',      icon: <Scissors size={14} /> },
  { key: 'tires',       label: 'Tires',        icon: <Zap size={14} /> },
  { key: 'other',       label: 'Other',        icon: <HelpCircle size={14} /> },
];

const FUEL_TYPES = ['petrol', 'diesel', 'cng'];
const today = () => new Date().toISOString().slice(0, 10);

/* ─── Toggle ─────────────────────────────────────────── */
function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-wrap">
      <div className={`toggle-track ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <div className="toggle-thumb" />
      </div>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
    </label>
  );
}

/* ─── Delete Confirm Popover ─────────────────────────── */
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div style={{
      background: 'var(--color-bg-overlay)', border: '1px solid rgba(248,113,113,0.3)',
      borderRadius: 'var(--radius-md)', padding: '12px 14px', marginTop: 8
    }}>
      <p style={{ fontSize: 12, color: 'var(--color-error)', marginBottom: 10 }}>
        Delete this entry? This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-danger" style={{ flex: 1, height: 32, fontSize: 12 }} onClick={onConfirm}>Delete</button>
        <button className="btn btn-secondary" style={{ flex: 1, height: 32, fontSize: 12 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── Recent Entry Item ──────────────────────────────── */
function EntryItem({ entry, onDelete, onEdit }) {
  const [confirm, setConfirm] = useState(false);
  const isFuel = !!entry.fuel_quantity;
  const Icon = isFuel ? Fuel : Wrench;
  const label = isFuel ? `${entry.fuel_quantity}L fill-up` : entry.title;
  const amount = isFuel ? entry.total_cost : entry.amount;
  const dateStr = isFuel ? entry.date : entry.date;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 0', borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0
        }}>
          <Icon size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dateStr}</p>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }}>
          ₹{Number(amount).toLocaleString('en-IN')}
        </span>
        <button className="btn btn-ghost" style={{ padding: 5 }} onClick={() => onEdit(entry)}>
          <Pencil size={12} />
        </button>
        <button className="btn btn-ghost" style={{ padding: 5, color: 'var(--color-error)' }} onClick={() => setConfirm(true)}>
          <Trash2 size={12} />
        </button>
      </div>
      {confirm && <DeleteConfirm onConfirm={() => onDelete(entry)} onCancel={() => setConfirm(false)} />}
    </div>
  );
}

/* ─── Expenditure Page ───────────────────────────────── */
export default function ExpenditurePage() {
  const { vehicle, showToast } = useApp();
  const [category, setCategory] = useState('fuel');
  const [stats, setStats]       = useState(null);
  const [recent, setRecent]     = useState([]);
  const [saving, setSaving]     = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  // Fuel form state
  const [fuel, setFuel] = useState({
    date: today(), odometer: '', quantity: '', price_per_liter: '',
    is_full_tank: true, missed: false, fuel_type: 'petrol', station: '', notes: '',
  });

  // Expense form state
  const [exp, setExp] = useState({
    date: today(), title: '', amount: '', odometer: '', notes: '',
  });

  async function loadData() {
    if (!vehicle) return;
    try {
      const [s, logs, expenses] = await Promise.all([
        api.stats.overview(vehicle.id),
        api.fuelLogs.list(vehicle.id),
        api.expenses.list(vehicle.id),
      ]);
      setStats(s);
      // Merge and sort recent entries
      const merged = [
        ...logs.map(l => ({ ...l, _type: 'fuel' })),
        ...expenses.map(e => ({ ...e, _type: 'expense' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
      setRecent(merged);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  useEffect(() => { loadData(); }, [vehicle?.id]);

  const setF = (k) => (e) => setFuel(f => ({ ...f, [k]: e.target.value }));
  const setE = (k) => (e) => setExp(f => ({ ...f, [k]: e.target.value }));

  const totalCost = fuel.quantity && fuel.price_per_liter
    ? (Number(fuel.quantity) * Number(fuel.price_per_liter)).toFixed(2)
    : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vehicle) return showToast('Select a vehicle first', 'error');
    setSaving(true);
    try {
      if (category === 'fuel') {
        await api.fuelLogs.create(vehicle.id, {
          vehicle_id: vehicle.id,
          date: fuel.date,
          odometer_reading: Number(fuel.odometer),
          fuel_quantity: Number(fuel.quantity),
          price_per_liter: Number(fuel.price_per_liter),
          is_full_tank: fuel.is_full_tank,
          missed: fuel.missed,
          fuel_type: fuel.fuel_type,
          station_name: fuel.station || null,
          notes: fuel.notes || null,
        });
        setFuel({ date: today(), odometer: '', quantity: '', price_per_liter: '', is_full_tank: true, missed: false, fuel_type: 'petrol', station: '', notes: '' });
      } else {
        await api.expenses.create(vehicle.id, {
          vehicle_id: vehicle.id,
          date: exp.date,
          category,
          title: exp.title,
          amount: Number(exp.amount),
          odometer_reading: exp.odometer ? Number(exp.odometer) : null,
          notes: exp.notes || null,
        });
        setExp({ date: today(), title: '', amount: '', odometer: '', notes: '' });
      }
      showToast('Entry saved successfully!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry) {
    try {
      if (entry._type === 'fuel') {
        await api.fuelLogs.delete(vehicle.id, entry.id);
      } else {
        await api.expenses.delete(vehicle.id, entry.id);
      }
      showToast('Entry deleted', 'warning');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const isFuelCat = category === 'fuel';
  const estRange = stats && vehicle?.tank_capacity
    ? Math.round((vehicle.tank_capacity - (recent[0]?.fuel_quantity || 0)) * (stats.avg_mileage_kmpl || 0))
    : null;

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Expenditure Logging
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Record fuel, maintenance, and other vehicle expenses
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* ── Form ── */}
        <form className="card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Category Tabs */}
          <div>
            <label className="input-label">Expense Category</label>
            <div className="tab-scroll">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key} type="button"
                  className={`tab-item ${category === cat.key ? 'active' : ''}`}
                  onClick={() => setCategory(cat.key)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Odometer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="input-label">Date *</label>
              <input className="input" type="date" value={isFuelCat ? fuel.date : exp.date}
                onChange={isFuelCat ? setF('date') : setE('date')} required />
            </div>
            <div>
              <label className="input-label">Odometer (km)</label>
              <input className="input" type="number" step="0.1" placeholder="145,200"
                value={isFuelCat ? fuel.odometer : exp.odometer}
                onChange={isFuelCat ? setF('odometer') : setE('odometer')}
                required={isFuelCat} />
            </div>
          </div>

          {/* Fuel-specific fields */}
          {isFuelCat ? (
            <>
              {/* Fuel Type */}
              <div>
                <label className="input-label">Fuel Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {FUEL_TYPES.map(ft => (
                    <button key={ft} type="button"
                      className={`tab-item ${fuel.fuel_type === ft ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setFuel(f => ({ ...f, fuel_type: ft }))}>
                      {ft.charAt(0).toUpperCase() + ft.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume + Price per L */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Volume (L) *</label>
                  <input className="input" type="number" step="0.01" placeholder="45.5"
                    value={fuel.quantity} onChange={setF('quantity')} required />
                </div>
                <div>
                  <label className="input-label">Price per Liter (₹) *</label>
                  <input className="input" type="number" step="0.01" placeholder="100.50"
                    value={fuel.price_per_liter} onChange={setF('price_per_liter')} required />
                </div>
              </div>

              {/* Auto total cost */}
              {totalCost && (
                <div style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border-active)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Auto-computed Total Cost</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-headline)', color: 'var(--color-primary)' }}>₹{Number(totalCost).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Station */}
              <div>
                <label className="input-label">Fuel Station (optional)</label>
                <input className="input" placeholder="e.g. Reliance Petrol Pump, Highway 44"
                  value={fuel.station} onChange={setF('station')} />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 24 }}>
                <Toggle checked={fuel.is_full_tank} onChange={(v) => setFuel(f => ({ ...f, is_full_tank: v }))} label="Full Tank Fill-up" />
                <Toggle checked={fuel.missed} onChange={(v) => setFuel(f => ({ ...f, missed: v }))} label="Missed a fill-up before this?" />
              </div>
            </>
          ) : (
            <>
              {/* Non-fuel: Title + Amount */}
              <div>
                <label className="input-label">Title *</label>
                <input className="input" placeholder="e.g. Oil Change, Annual Insurance"
                  value={exp.title} onChange={setE('title')} required />
              </div>
              <div>
                <label className="input-label">Amount (₹) *</label>
                <input className="input" type="number" step="0.01" placeholder="2500"
                  value={exp.amount} onChange={setE('amount')} required />
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label className="input-label">Additional Notes (optional)</label>
            <textarea className="input" placeholder="Any additional details…"
              value={isFuelCat ? fuel.notes : exp.notes}
              onChange={isFuelCat ? setF('notes') : setE('notes')} style={{ minHeight: 72 }} />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving || !vehicle}
            style={{ height: 46, fontSize: 15, marginTop: 4 }}>
            {saving ? 'Saving…' : '+ Add Entry'}
          </button>
        </form>

        {/* ── Right Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Telemetry */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Current Telemetry
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Avg Efficiency</p>
                <p style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {stats?.avg_mileage_kmpl ? `${Number(stats.avg_mileage_kmpl).toFixed(1)}` : '—'}
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}> km/L</span>
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>Est. Range</p>
                <p style={{ fontFamily: 'var(--font-headline)', fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {estRange != null ? estRange : vehicle?.tank_capacity ? '—' : 'N/A'}
                  {estRange != null && <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 400 }}> km</span>}
                </p>
                {!vehicle?.tank_capacity && (
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>Set tank capacity in vehicle settings</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Recent Entries
            </h3>
            {recent.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '16px 0' }}>No entries yet.</p>
            ) : (
              recent.map(entry => (
                <EntryItem key={`${entry._type}-${entry.id}`} entry={entry}
                  onDelete={handleDelete} onEdit={setEditEntry} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
