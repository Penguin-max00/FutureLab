import { money } from '../lib/utils';
export function MetricDelta({
  value,
  original,
}: {
  value: number;
  original: number;
}) {
  // Match the dollar precision used by the primary result; avoid “−$0”.
  const rounded = Math.round(value) - Math.round(original);
  return (
    <small
      className="metric-delta"
      aria-label={`${rounded < 0 ? 'Decrease' : 'Increase'} of ${money(Math.abs(rounded))} versus original baseline`}
    >
      {rounded === 0
        ? '—'
        : `${rounded < 0 ? '−' : '+'}${money(Math.abs(rounded))}`}
    </small>
  );
}
