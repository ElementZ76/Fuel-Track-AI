/**
 * Skeleton loaders for all data-fetching states
 */
export function SkeletonCard({ height = 100 }) {
  return <div className="skeleton" style={{ height, borderRadius: 'var(--radius-lg)' }} />;
}

export function SkeletonText({ width = '100%', height = 14 }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 4 }} />;
}

export function SkeletonRow() {
  return (
    <tr>
      {Array(5).fill(0).map((_, i) => (
        <td key={i} style={{ padding: '14px' }}>
          <div className="skeleton" style={{ height: 12, width: i === 0 ? 80 : '70%', borderRadius: 4 }} />
        </td>
      ))}
    </tr>
  );
}
