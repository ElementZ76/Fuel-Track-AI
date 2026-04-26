import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Fuel, Wrench, Settings, Shield, ParkingCircle, ArrowRightLeft, Sparkles, Scissors, HelpCircle, CheckCircle, Pencil, Trash2, X, Zap } from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';

/* ─── Category config ────────────────────────────────── */
const CATEGORIES = [
  { key: 'fuel',        label: 'Fuel',        icon: <Fuel size={14} /> },
  { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={14} /> },
  { key: 'insurance',   label: 'Insurance',   icon: <Shield size={14} /> },
  { key: 'other',       label: 'Other',       icon: <HelpCircle size={14} /> },
];

const MAINTENANCE_TYPES = [
  { key: 'maintenance', label: 'General Maintenance' },
  { key: 'service',     label: 'General Service' },
  { key: 'repairs',     label: 'Repairs' },
  { key: 'tires',       label: 'Tires' },
  { key: 'wash',        label: 'Wash' },
];

const OTHER_TYPES = [
  { key: 'other',       label: 'Other' },
  { key: 'tolls',       label: 'Tolls' },
  { key: 'parking',     label: 'Parking' },
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
  const Icon = isFuel ? Fuel : Shield;
  const label = isFuel ? `${entry.fuel_quantity}L fill-up` : entry.title;
  const amount = isFuel ? entry.total_cost : entry.amount;
  const dateStr = isFuel ? entry.date : entry.date;
  const odo = entry.odometer_reading;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        padding: '10px 0', borderBottom: '1px solid var(--color-border)',
      }} onClick={() => onView(entry)}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {odo != null && <p style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600 }}>{Number(odo).toLocaleString('en-IN')} km</p>}
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{dateStr}</p>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', flexShrink: 0 }}>
          ₹{Number(amount).toLocaleString('en-IN')}
        </span>
        <button className="btn btn-ghost" style={{ padding: 5 }} onClick={(e) => { e.stopPropagation(); onEdit(entry); }}>
          <Pencil size={12} />
        </button>
        <button className="btn btn-ghost" style={{ padding: 5, color: 'var(--color-error)' }} onClick={(e) => { e.stopPropagation(); setConfirm(true); }}>
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
  const [viewEntry, setViewEntry] = useState(null);

  // Fuel form state
  const [fuel, setFuel] = useState({
    date: today(), odometer: '', quantity: '', price_per_liter: '', total_cost: '',
    is_full_tank: true, missed: false, fuel_type: '', station: '', notes: '',
  });

  // Expense form state
  const [exp, setExp] = useState({
    date: today(), title: '', amount: '', odometer: '', notes: '', expiry_date: '',
    sub_category: '',
  });

  useEffect(() => {
    if (vehicle) {
      setFuel(prev => ({ ...prev, fuel_type: vehicle.fuel_type }));
    }
  }, [vehicle]);

  useEffect(() => {
    if (editEntry) {
      if (editEntry._type === 'fuel') {
        setCategory('fuel');
        setFuel({
          id: editEntry.id,
          date: editEntry.date,
          odometer: editEntry.odometer_reading,
          quantity: editEntry.fuel_quantity,
          price_per_liter: editEntry.price_per_liter,
          total_cost: editEntry.total_cost,
          is_full_tank: editEntry.is_full_tank,
          missed: editEntry.missed,
          fuel_type: editEntry.fuel_type,
          station: editEntry.station_name || '',
          notes: editEntry.notes || ''
        });
      } else {
        const mainCat = ['maintenance', 'service', 'repairs', 'tires', 'wash'].includes(editEntry.category) ? 'maintenance' :
                        ['parking', 'tolls', 'other'].includes(editEntry.category) ? 'other' : editEntry.category;
        
        setCategory(mainCat);
        setExp({
          id: editEntry.id,
          date: editEntry.date,
          title: editEntry.title,
          amount: editEntry.amount,
          odometer: editEntry.odometer_reading || '',
          notes: editEntry.notes || '',
          expiry_date: editEntry.expiry_date || '',
          sub_category: editEntry.category,
        });
      }
    }
  }, [editEntry]);

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

  const handleFuelBlur = (field) => {
    setFuel(prev => {
      const next = { ...prev };
      
      const q = next.quantity === '' ? null : Number(next.quantity);
      const p = next.price_per_liter === '' ? null : Number(next.price_per_liter);
      const t = next.total_cost === '' ? null : Number(next.total_cost);
      
      const value = next[field] === '' ? null : Number(next[field]);
      
      if (value !== null) {
        if (field === 'quantity') {
          if (p !== null) next.total_cost = (value * p).toFixed(2);
          else if (t !== null && value != 0) next.price_per_liter = (t / value).toFixed(2);
        } else if (field === 'price_per_liter') {
          if (q !== null) next.total_cost = (q * value).toFixed(2);
          else if (t !== null && value != 0) next.quantity = (t / value).toFixed(2);
        } else if (field === 'total_cost') {
          if (q !== null && q != 0) next.price_per_liter = (value / q).toFixed(2);
          else if (p !== null && p != 0) next.quantity = (value / p).toFixed(2);
        }
      }
      return next;
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!vehicle) return showToast('Select a vehicle first', 'error');
    setSaving(true);
    try {
      if (category === 'fuel') {
        const provided = [fuel.quantity, fuel.price_per_liter, fuel.total_cost].filter(v => v !== '').length;
        if (provided < 2) {
          setSaving(false);
          return showToast('Please enter at least two: Volume, Price, or Total Cost', 'error');
        }

        const payload = {
          vehicle_id: vehicle.id,
          date: fuel.date,
          odometer_reading: Number(fuel.odometer),
          fuel_quantity: fuel.quantity ? Number(fuel.quantity) : null,
          price_per_liter: fuel.price_per_liter ? Number(fuel.price_per_liter) : null,
          total_cost: fuel.total_cost ? Number(fuel.total_cost) : null,
          is_full_tank: fuel.is_full_tank,
          missed: fuel.missed,
          fuel_type: fuel.fuel_type,
          station_name: fuel.station || null,
          notes: fuel.notes || null,
        };

        if (fuel.id) await api.fuelLogs.update(vehicle.id, fuel.id, payload);
        else await api.fuelLogs.create(vehicle.id, payload);

        setEditEntry(null);
        setFuel({ date: today(), odometer: '', quantity: '', price_per_liter: '', total_cost: '', is_full_tank: true, missed: false, fuel_type: 'petrol', station: '', notes: '' });
      } else {
        const finalCategory = (category === 'maintenance' || category === 'other') 
          ? (exp.sub_category || category) 
          : category;

        const payload = {
          vehicle_id: vehicle.id,
          date: exp.date,
          category: finalCategory,
          title: exp.title,
          amount: Number(exp.amount),
          odometer_reading: exp.odometer ? Number(exp.odometer) : null,
          expiry_date: exp.expiry_date || null,
          notes: exp.notes || null,
        };

        if (exp.id) await api.expenses.update(vehicle.id, exp.id, payload);
        else await api.expenses.create(vehicle.id, payload);

        setEditEntry(null);
        setExp({ date: today(), title: '', amount: '', odometer: '', notes: '', expiry_date: '', sub_category: '' });
      }
      showToast(editEntry ? 'Entry updated successfully!' : 'Entry saved successfully!', 'success');
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
              {/* Volume + Price per L + Total Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">Volume (L)</label>
                  <input className="input" type="number" step="0.01" placeholder="45.5"
                    value={fuel.quantity} onChange={setF('quantity')} onBlur={() => handleFuelBlur('quantity')} />
                </div>
                <div>
                  <label className="input-label">Price / L (₹)</label>
                  <input className="input" type="number" step="0.01" placeholder="100.50"
                    value={fuel.price_per_liter} onChange={setF('price_per_liter')} onBlur={() => handleFuelBlur('price_per_liter')} />
                </div>
                <div>
                  <label className="input-label">Total Cost (₹)</label>
                  <input className="input" type="number" step="0.01" placeholder="4572.75"
                    value={fuel.total_cost} onChange={setF('total_cost')} onBlur={() => handleFuelBlur('total_cost')} />
                </div>
              </div>

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
              {/* Sub-category Dropdown */}
              {category === 'maintenance' && (
                <div>
                  <label className="input-label">Maintenance Type *</label>
                  <select className="input" value={exp.sub_category} onChange={setE('sub_category')} required>
                    <option value="">Select Type...</option>
                    {MAINTENANCE_TYPES.map(mt => (
                      <option key={mt.key} value={mt.key}>{mt.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {category === 'other' && (
                <div>
                  <label className="input-label">Other Type *</label>
                  <select className="input" value={exp.sub_category} onChange={setE('sub_category')} required>
                    <option value="">Select Type...</option>
                    {OTHER_TYPES.map(ot => (
                      <option key={ot.key} value={ot.key}>{ot.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Non-fuel: Title + Amount */}
              <div>
                <label className="input-label">{category === 'insurance' ? 'Insurance Provider *' : 'Title *'}</label>
                <input className="input" placeholder={category === 'insurance' ? 'e.g. HDFC Ergo, LIC' : 'e.g. Oil Change, New Tires'}
                  value={exp.title} onChange={setE('title')} required />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="input-label">{category === 'insurance' ? 'Premium Amount (₹) *' : 'Amount (₹) *'}</label>
                  <input className="input" type="number" step="0.01" placeholder="2500"
                    value={exp.amount} onChange={setE('amount')} required />
                </div>
                {category === 'insurance' && (
                  <div>
                    <label className="input-label">Expiry Date</label>
                    <input className="input" type="date" value={exp.expiry_date} onChange={setE('expiry_date')} />
                  </div>
                )}
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

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !vehicle}
              style={{ flex: 1, height: 46, fontSize: 15 }}>
              {saving ? 'Saving…' : (editEntry ? 'Update Entry' : '+ Add Entry')}
            </button>
            {editEntry && (
              <button type="button" className="btn btn-secondary" disabled={saving}
                style={{ height: 46, padding: '0 20px' }}
                onClick={() => {
                  setEditEntry(null);
                  setFuel({ date: today(), odometer: '', quantity: '', price_per_liter: '', total_cost: '', is_full_tank: true, missed: false, fuel_type: vehicle?.fuel_type || '', station: '', notes: '' });
                  setExp({ date: today(), title: '', amount: '', odometer: '', notes: '', expiry_date: '', sub_category: '' });
                }}>
                Cancel
              </button>
            )}
          </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Recent Entries
              </h3>
              <Link to="/logs" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '16px 0' }}>No entries yet.</p>
            ) : (
              recent.map(entry => (
                <EntryItem key={`${entry._type}-${entry.id}`} entry={entry}
                  onDelete={handleDelete} onEdit={setEditEntry} onView={setViewEntry} />
              ))
            )}
          </div>
        </div>
      </div>

      {viewEntry && (
        <Modal title={viewEntry._type === 'fuel' ? 'Fuel Log Details' : 'Expense Details'} onClose={() => setViewEntry(null)}>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Date</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{viewEntry.date}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Odometer</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{viewEntry.odometer_reading} km</p>
              </div>
            </div>
            
            {viewEntry._type === 'fuel' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Quantity</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{viewEntry.fuel_quantity} L</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Price per Liter</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>₹{viewEntry.price_per_liter}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total Cost</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>₹{viewEntry.total_cost}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Mileage (km/L)</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>
                      {viewEntry.mileage_kmpl ? `${viewEntry.mileage_kmpl} km/L` : '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Flags</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className="badge">{viewEntry.fuel_type}</span>
                    {viewEntry.is_full_tank ? (
                      <span className="badge" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>Full Tank</span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>Partial Fill</span>
                    )}
                    {viewEntry.missed && <span className="badge" style={{ background: 'var(--color-error)', color: '#fff' }}>Missed Prior Log</span>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Title</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{viewEntry.title}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Category</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{viewEntry.category}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Amount</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>₹{viewEntry.amount}</p>
                  </div>
                </div>
                {viewEntry.expiry_date && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Expiry Date</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-error)' }}>{viewEntry.expiry_date}</p>
                  </div>
                )}
              </>
            )}
            
            {viewEntry.station_name && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Station / Vendor</p>
                <p style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{viewEntry.station_name}</p>
              </div>
            )}
            
            {viewEntry.notes && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Notes</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)', padding: 10, borderRadius: 6, marginTop: 4 }}>
                  {viewEntry.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
