import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, AlertTriangle, Lock } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';
import { SkeletonCard } from '../components/Skeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B6780', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B6780', font: { size: 11 } } },
  },
  responsive: true,
  maintainAspectRatio: false,
};

export default function AnalysisPage() {
  const { vehicle, showToast } = useApp();
  const [stats, setStats]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!vehicle) return;
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        api.stats.overview(vehicle.id),
        api.stats.monthly(vehicle.id),
      ]);
      setStats(s);
      setMonthly(m);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [vehicle?.id]);

  if (!vehicle) {
    return (
      <div style={{ padding: 28 }}>
        <PageHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
          Select a vehicle to view analysis
        </div>
      </div>
    );
  }

  const labels = monthly.map(m => m.month);

  const mileageLineData = {
    labels,
    datasets: [{
      label: 'Avg Mileage (km/L)',
      data: monthly.map(m => m.avg_mileage),
      borderColor: 'rgba(128,105,191,0.9)',
      backgroundColor: 'rgba(128,105,191,0.1)',
      borderWidth: 2, fill: true, tension: 0.35, pointRadius: 4,
      pointBackgroundColor: 'var(--color-primary)',
      spanGaps: true,
    }],
  };

  const costBarData = {
    labels,
    datasets: [
      {
        label: 'Fuel Cost',
        data: monthly.map(m => m.fuel_cost),
        backgroundColor: 'rgba(128,105,191,0.7)',
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: monthly.map(m => m.expense_cost),
        backgroundColor: 'rgba(201,167,77,0.7)',
        borderRadius: 4,
      },
    ],
  };
  const barOpts = {
    ...chartDefaults,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#A09CB0', font: { size: 11 }, boxWidth: 10, padding: 14 },
      },
    },
  };

  const fmt = (n, d = 1) => n != null ? Number(n).toFixed(d) : '—';
  const fmtINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader />

      {/* Summary Tiles */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} height={100} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <SummaryTile label="Total Distance" value={`${fmt(stats?.total_distance_km, 0)} km`} icon={<TrendingUp size={16} />} />
          <SummaryTile label="Total Fuel" value={`${fmt(stats?.total_fuel_liters, 1)} L`} icon={<TrendingUp size={16} />} />
          <SummaryTile label="Best Mileage" value={`${fmt(stats?.best_mileage_kmpl)} km/L`} icon={<Award size={16} />} color="var(--color-tertiary)" />
          <SummaryTile label="Worst Mileage" value={`${fmt(stats?.worst_mileage_kmpl)} km/L`} icon={<AlertTriangle size={16} />} color="var(--color-error)" />
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Mileage Trend (by Month)
          </h3>
          {loading ? <SkeletonCard height={220} /> : monthly.length === 0 ? (
            <EmptyState label="No data yet" />
          ) : (
            <div style={{ height: 220 }}>
              <Line data={mileageLineData} options={{ ...chartDefaults, plugins: { legend: { display: false } } }} />
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>
            Monthly Cost Breakdown
          </h3>
          {loading ? <SkeletonCard height={220} /> : monthly.length === 0 ? (
            <EmptyState label="No data yet" />
          ) : (
            <div style={{ height: 220 }}>
              <Bar data={costBarData} options={barOpts} />
            </div>
          )}
        </div>
      </div>

      {/* Monthly Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Monthly Breakdown
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Distance (km)</th>
                <th>Fuel (L)</th>
                <th>Avg Mileage</th>
                <th>Fuel Cost</th>
                <th>Expenses</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(0).map((__, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : monthly.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No monthly data yet
                  </td>
                </tr>
              ) : (
                [...monthly].reverse().map(m => (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.month}</td>
                    <td>{fmt(m.distance_km, 0)}</td>
                    <td>{fmt(m.fuel_liters, 1)}</td>
                    <td>
                      {m.avg_mileage
                        ? <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{fmt(m.avg_mileage)} km/L</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td>{fmtINR(m.fuel_cost)}</td>
                    <td>{fmtINR(m.expense_cost)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmtINR(m.total_cost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coming Soon — Predictive AI */}
      <div style={{
        position: 'relative', padding: 28, borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(128,105,191,0.25)',
        background: 'linear-gradient(135deg, rgba(128,105,191,0.07) 0%, rgba(201,167,77,0.04) 100%)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, backdropFilter: 'blur(0px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Predictive Fuel Analysis
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            AI-driven forecasts & confidence scoring — coming in a future update
          </p>
          <span className="badge badge-primary" style={{ marginTop: 4 }}>Coming Soon</span>
        </div>
        {/* Ghost content for visual depth */}
        <div style={{ opacity: 0.12, pointerEvents: 'none', filter: 'blur(3px)' }}>
          <div style={{ height: 140, background: 'var(--color-bg-overlay)', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Analysis
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
        Historical performance and cost insights
      </p>
    </div>
  );
}

function SummaryTile({ label, value, icon, color = 'var(--color-primary)' }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ color, opacity: 0.85 }}>{icon}</div>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
      {label}
    </div>
  );
}
