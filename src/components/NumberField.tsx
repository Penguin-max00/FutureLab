import { useId, useState } from 'react';
interface Props {
  label: string;
  value: number | null;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  onEmpty?: () => void;
  onValidityChange?: (valid: boolean) => void;
  placeholder?: string;
  hint?: string;
  showHint?: boolean;
  required?: boolean;
}
export function NumberField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
  onEmpty,
  onValidityChange,
  placeholder,
  hint,
  showHint = false,
  required = false,
}: Props) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const percent = unit === '%';
  const display =
    value === null ? '' : percent ? Number((value * 100).toFixed(4)) : value;
  const shown = draft ?? String(display);
  const number = Number(shown);
  const actual = percent ? number / 100 : number;
  const valid =
    shown.trim() !== '' &&
    Number.isFinite(actual) &&
    actual >= min &&
    actual <= max &&
    (!['years', 'months'].includes(unit) || Number.isInteger(actual));
  const error = !valid && draft !== null;
  return (
    <div className="field">
      <label htmlFor={id} title={hint}>
        {label}
      </label>
      <div className={`input-shell ${error ? 'invalid' : ''}`}>
        <span>{['year', 'total', 'month'].includes(unit) ? '$' : ''}</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={percent ? min * 100 : min}
          max={percent ? max * 100 : max}
          step={percent ? 0.1 : 1}
          value={shown}
          placeholder={placeholder}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error}
          aria-describedby={
            [hint ? `${id}-help` : '', error ? `${id}-error` : '']
              .filter(Boolean)
              .join(' ') || undefined
          }
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            const v = percent ? n / 100 : n;
            const nextValid =
              !!e.target.value.trim() &&
              Number.isFinite(v) &&
              v >= min &&
              v <= max &&
              (!['years', 'months'].includes(unit) || Number.isInteger(v));
            onValidityChange?.(nextValid);
            if (nextValid) onChange(v);
            else onEmpty?.();
          }}
          onBlur={() => {
            if (valid) setDraft(null);
          }}
        />
        <span>
          {unit === 'year'
            ? '/ yr'
            : unit === 'total'
              ? 'total'
              : unit === 'month'
                ? '/ mo'
                : unit}
        </span>
      </div>
      {hint && (
        <small
          id={`${id}-help`}
          className={showHint ? 'field-help' : 'sr-only'}
        >
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="field-error">
          Enter{' '}
          {['years', 'months'].includes(unit) ? 'a whole number' : 'a value'}{' '}
          from {percent ? min * 100 : min} to {percent ? max * 100 : max}.{' '}
          {onEmpty
            ? 'Complete this field to continue.'
            : 'Results use the last valid value.'}
        </small>
      )}
    </div>
  );
}
