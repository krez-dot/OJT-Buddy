export function Skeleton({ width = '100%', height = '16px', radius = '6px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Skeleton height="18px" width="40%" />
      <Skeleton height="14px" />
      <Skeleton height="14px" width="80%" />
      <Skeleton height="14px" width="60%" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Skeleton height="12px" width="50%" />
      <Skeleton height="32px" width="60%" />
      <Skeleton height="8px" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
