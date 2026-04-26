import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { SkeletonRow } from '../components/Skeleton';

export default function FuelLogListPage() {
  const { vehicle, showToast } = useApp();
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  async function load() {
    if (!vehicle) return;
    setLoading(true);
    try {
      const data = await api.fuelLogs.list(vehicle.id);
      setLogs(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [vehicle?.id]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...logs].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ col }) {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  }

  function Th({ col, label }) {
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {label} <SortIcon col={col} />
        </span>
      </th>
    );
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/dashboard" className="btn btn-ghost" style={{ padding: 8 }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            All Fuel Logs
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {vehicle?.name} — {logs.length} entries
          </p>
        </div>
      </div>

      {!vehicle ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)' }}>
          Select a vehicle to view logs.
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <Th col="date" label="Date" />
                  <Th col="odometer_reading" label="Odometer (km)" />
                  <Th col="fuel_quantity" label="Fuel (L)" />
                  <Th col="price_per_liter" label="₹/L" />
                  <Th col="total_cost" label="Total (₹)" />
                  <Th col="mileage_kmpl" label="Mileage" />
                  <th>Station</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      No fuel logs found. <Link to="/expenditure" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Add a fill-up →</Link>
                    </td>
                  </tr>
                ) : (
                  sorted.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.date}</td>
                      <td>{Number(log.odometer_reading).toLocaleString('en-IN')}</td>
                      <td>{log.fuel_quantity}</td>
                      <td>₹{log.price_per_liter}</td>
                      <td style={{ fontWeight: 500 }}>₹{Number(log.total_cost).toLocaleString('en-IN')}</td>
                      <td>
                        {log.mileage_kmpl != null
                          ? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{log.mileage_kmpl} km/L</span>
                          : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                        {log.station_name || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {!log.is_full_tank && <span className="badge badge-neutral" style={{ fontSize: 10 }}>Partial</span>}
                          {log.missed && <span className="badge badge-error" style={{ fontSize: 10 }}>Missed</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
