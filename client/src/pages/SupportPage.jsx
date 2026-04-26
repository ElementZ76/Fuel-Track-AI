export default function SupportPage() {
  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        Support
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Need help? Reach out to the FuelTrack AI admin team.
      </p>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          Contact information will be added here once the project is complete.
        </p>
      </div>
    </div>
  );
}
