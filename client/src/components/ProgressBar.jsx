export default function ProgressBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-bar" title={`${pct}% complete`}>
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
