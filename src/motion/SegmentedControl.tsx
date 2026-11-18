import type { CSSProperties } from 'react';
interface Option<T extends string | number> {
  value: T;
  label: string;
}
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const index = options.findIndex((option) => option.value === value);
  const style = {
    '--segment-count': options.length,
    '--segment-index': Math.max(0, index),
  } as CSSProperties;
  return (
    <div
      className="segmented glass-segmented"
      role="group"
      aria-label={label}
      style={style}
    >
      <span className="segment-indicator" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
