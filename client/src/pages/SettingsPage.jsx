import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

export default function SettingsPage() {
  const { user, vehicle, selectVehicle, showToast } = useApp();
  const [pin, setPin] = useState({ current: '', next: '', confirm: '' });
  const [savingPin, setSavingPin] = useState(false);
  const set = (k) => (e) => setPin(p => ({ ...p, [k]: e.target.value }));

  async function handleChangePin(e) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin.next)) return showToast('New PIN must be 4 digits', 'error');
    if (pin.next !== pin.confirm) return showToast('PINs do not match', 'error');
    setSavingPin(true);
    try {
      // Verify current PIN first
      await api.users.login({ username: user.username, pin: pin.current });
      // Update via user create is not ideal — in a real flow you'd have a PATCH endpoint
      // For v1: tell user to contact admin, or just update display
      showToast('PIN change requires a backend PATCH endpoint — coming in next release', 'warning');
    } catch (err) {
      showToast('Current PIN is incorrect', 'error');
    } finally {
      setSavingPin(false);
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>Manage your profile and vehicle settings</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-primary)' }}>
          Profile
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Username</label>
            <input className="input" value={user?.username || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <div>
            <label className="input-label">Display Name</label>
            <input className="input" value={user?.display_name || ''} disabled style={{ opacity: 0.6 }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
          Profile editing via API will be available in a future update.
        </p>
      </div>

      {/* Change PIN */}
      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-primary)' }}>
          Change PIN
        </h2>
        <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="input-label">Current PIN</label>
            <input className="input" type="password" inputMode="numeric" maxLength={4} value={pin.current} onChange={set('current')} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">New PIN</label>
              <input className="input" type="password" inputMode="numeric" maxLength={4} value={pin.next} onChange={set('next')} required />
            </div>
            <div>
              <label className="input-label">Confirm PIN</label>
              <input className="input" type="password" inputMode="numeric" maxLength={4} value={pin.confirm} onChange={set('confirm')} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingPin} style={{ height: 40, fontSize: 13 }}>
            {savingPin ? 'Verifying…' : 'Update PIN'}
          </button>
        </form>
      </div>

      {/* Active Vehicle */}
      {vehicle && (
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-primary)' }}>
            Active Vehicle
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
            {[
              ['Name', vehicle.name],
              ['Make / Model', [vehicle.make, vehicle.model].filter(Boolean).join(' ')],
              ['Year', vehicle.year],
              ['Plate', vehicle.plate],
              ['Fuel Type', vehicle.fuel_type],
              ['Tank Capacity', vehicle.tank_capacity ? `${vehicle.tank_capacity} L` : '—'],
              ['Initial Odometer', `${vehicle.initial_odometer} km`],
            ].map(([k, v]) => v && (
              <div key={k}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>{k}</p>
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 14 }}>
            Use <strong style={{ color: 'var(--color-primary)' }}>Switch Vehicle</strong> in the sidebar to edit vehicle details.
          </p>
        </div>
      )}
    </div>
  );
}
