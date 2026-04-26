import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Fuel, TrendingUp, DollarSign, ArrowRight,
  TrendingDown, Minus, Download
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend, Filler, ArcElement, BarElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { SkeletonCard, SkeletonText } from '../components/Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler, ArcElement, BarElement);

/* ─── Stat Card ─────────────────────────────────────── */
function StatCard({ icon, label, value, sub, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'var(--color-success)' : trend < 0 ? 'var(--color-error)' : 'var(--color-neutral)';

  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'
          }}>
            {icon}
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</span>
        </div>
        {trend !== undefined && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: trendColor }}>
            <TrendIcon size={12} />
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

/* ─── No Vehicle Prompt ──────────────────────────────── */
function NoVehiclePrompt() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: 16, textAlign: 'center'
    }}>
      <div style={{ fontSize: 48 }}>🚗</div>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, color: 'var(--color-text-primary)' }}>
        No Vehicle Selected
      </h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 320 }}>
        Use <strong style={{ color: 'var(--color-primary)' }}>Switch Vehicle</strong> in the sidebar to select or add a vehicle to get started.
      </p>
    </div>
  );
}

/* ─── Dashboard Page ─────────────────────────────────── */
export default function DashboardPage() {
  const { vehicle, showToast } = useApp();
  const [stats, setStats]     = useState(null);
  const [logs, setLogs]       = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!vehicle) return;
    setLoading(true);
    try {
      const [s, l, m] = await Promise.all([
        api.stats.overview(vehicle.id),
        api.fuelLogs.list(vehicle.id),
        api.stats.monthly(vehicle.id),
      ]);
      setStats(s);
      setAllLogs(l);
      setLogs(l.slice(0, 5));
      setMonthly(m);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [vehicle?.id]);

  if (!vehicle) return (
    <div style={{ padding: 32 }}>
      <TopBar onExport={() => showToast('CSV Export — Coming Soon!', 'warning')} />
      <NoVehiclePrompt />
    </div>
  );

  const fmt = (n, d = 2) => n != null ? Number(n).toFixed(d) : '—';
  const fmtINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

  // Chart data (plot individual valid logs chronologically)
  const validLogsForChart = [...allLogs].reverse().filter(log => log.mileage_kmpl != null);
  const chartLabels = validLogsForChart.map(log => log.date);
  const mileageData = validLogsForChart.map(log => log.mileage_kmpl);
  const lineData = {
    labels: chartLabels,
    datasets: [{
      label: 'Avg Mileage (km/L)',
      data: mileageData,
      borderColor: 'rgba(128,105,191,0.9)',
      backgroundColor: 'rgba(128,105,191,0.08)',
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: 'var(--color-primary)',
      fill: true,
      tension: 0.35,
      spanGaps: true,
    }],
  };
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: ctx => `${ctx.parsed.y?.toFixed(1)} km/L`
    }}},
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B6780', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B6780', font: { size: 11 } } },
    },
  };

  // Cost breakdown donut
  const catData = stats?.expense_by_category || [];
  const doughnutData = {
    labels: catData.map(c => c.category),
    datasets: [{
      data: catData.map(c => c.total_amount),
      backgroundColor: ['#8069BF','#C9A74D','#7C7296','#4ADE80','#F87171','#60A5FA'],
      borderWidth: 0,
    }],
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: { legend: { position: 'right', labels: { color: '#A09CB0', font: { size: 11 }, padding: 10 } } },
  };

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <TopBar onExport={() => showToast('CSV Export — Coming Soon!', 'warning')} />

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16 }}>
          {[1,2,3].map(i => <SkeletonCard key={i} height={120} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16 }}>
          <StatCard
            icon={<Fuel size={16} />}
            label="Current Mileage"
            value={stats?.avg_mileage_kmpl ? `${fmt(stats.avg_mileage_kmpl, 1)} km/L` : '—'}
            sub="Vehicle Average"
          />
          <StatCard
            icon={<DollarSign size={16} />}
            label="Total Fuel Spent"
            value={fmtINR(stats?.total_fuel_spent)}
            sub={`${fmt(stats?.total_fuel_liters, 1)} L consumed`}
          />
          <StatCard
            icon={<TrendingUp size={16} />}
            label="Avg Cost / km"
            value={stats?.avg_cost_per_km ? `₹${fmt(stats.avg_cost_per_km)}` : '—'}
            sub={`${fmt(stats?.total_distance_km, 0)} km tracked`}
          />
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Mileage Trend */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Mileage Trend
          </h3>
          {loading ? <SkeletonCard height={200} /> : (
            validLogsForChart.length === 0 ? (
              <EmptyChart label="Add full-tank fill-ups to see your mileage trend" />
            ) : (
              <div style={{ height: 220 }}>
                <Line data={lineData} options={lineOpts} />
              </div>
            )
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Cost Breakdown
          </h3>
          {loading ? <SkeletonCard height={200} /> : (
            catData.length === 0 ? (
              <EmptyChart label="No expenses logged yet" />
            ) : (
              <div style={{ height: 220 }}>
                <Doughnut data={doughnutData} options={doughnutOpts} />
              </div>
            )
          )}
        </div>
      </div>

      {/* Recent Fuel Logs Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Recent Fuel Logs
          </h3>
          <Link to="/logs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
            View All <ArrowRight size={13} />
          </Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Odometer (km)</th>
                <th>Fuel (L)</th>
                <th>Mileage</th>
                <th>Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(5).fill(0).map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No fuel logs yet. <Link to="/expenditure" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Add your first fill-up →</Link>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{log.date}</td>
                    <td>{Number(log.odometer_reading).toLocaleString('en-IN')}</td>
                    <td>{log.fuel_quantity} L</td>
                    <td>
                      {log.mileage_kmpl != null
                        ? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{log.mileage_kmpl} km/L</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      }
                    </td>
                    <td>₹{Number(log.total_cost).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
      {label}
    </div>
  );
}

function TopBar({ onExport }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
          Fleet performance overview
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={onExport}>
          <Download size={14} /> Export
        </button>
        <Link to="/expenditure" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          + Add Log
        </Link>
      </div>
    </div>
  );
}
