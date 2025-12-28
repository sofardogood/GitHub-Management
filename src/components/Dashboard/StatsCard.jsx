export default function StatsCard({ label, value, sublabel }) {
  return (
    <div className="stats-card reveal">
      <div className="stats-value">{value}</div>
      <div className="stats-label">{label}</div>
      {sublabel ? <div className="stats-sublabel">{sublabel}</div> : null}
    </div>
  );
}

