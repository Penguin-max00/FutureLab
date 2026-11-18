import { useId } from 'react';
import type { ExplorerModel } from '../state/useExploration';
import { money } from '../lib/utils';
import { Button } from './ui/button';
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatted: string;
  onChange: (value: number) => void;
}
function TrialSlider({
  label,
  value,
  min,
  max,
  step,
  formatted,
  onChange,
}: SliderProps) {
  const id = useId();
  return (
    <div className="trial-slider">
      <div className="trial-slider-label">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{formatted}</output>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={formatted}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="trial-range">
        <span>{min < 0 ? 'Lower' : '$0'}</span>
        <span>{max === 20000 ? '$20,000 / yr' : 'Higher'}</span>
      </div>
    </div>
  );
}
const signedPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`;
const signedMoney = (value: number) =>
  `${value < 0 ? '−' : value > 0 ? '+' : ''}${money(Math.abs(value))}`;
export function QuickWhatIf({
  model,
  names,
}: {
  model: ExplorerModel;
  names: string[];
}) {
  const { changes } = model.exploration;
  function updatePair(
    key: 'extraAid' | 'salaryChange',
    index: number,
    value: number,
  ) {
    model.setExploration((previous) => {
      const pair = Array.from(
        { length: names.length },
        (_, i) => previous.changes[key][i] ?? 0,
      );
      pair[index] = value;
      return { ...previous, changes: { ...previous.changes, [key]: pair } };
    });
  }
  return (
    <section
      className="quick-panel panel-stage"
      id="quick-what-if"
      aria-label="Quick what-if controls"
    >
      <div className="quick-panel-heading">
        <span>Change a little. See the difference.</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={model.count === 0}
          onClick={model.clearChanges}
        >
          Clear adjustments
        </Button>
      </div>
      <div className="quick-grid">
        {names.map((name, i) => (
          <div className="quick-college" key={i}>
            <h3>
              <span className={`tiny-letter color-${i}`}>{'ABCD'[i]}</span>
              {name}
            </h3>
            <TrialSlider
              label={`Extra annual aid · ${'ABCD'[i]}`}
              value={changes.extraAid[i] ?? 0}
              min={0}
              max={20000}
              step={500}
              formatted={`+${money(changes.extraAid[i] ?? 0)} / yr`}
              onChange={(v) => updatePair('extraAid', i, v)}
            />
            <TrialSlider
              label={`Starting salary change · ${'ABCD'[i]}`}
              value={(changes.salaryChange[i] ?? 0) * 100}
              min={-20}
              max={20}
              step={1}
              formatted={signedPercent(changes.salaryChange[i] ?? 0)}
              onChange={(v) => updatePair('salaryChange', i, v / 100)}
            />
            <p className="effective-value">
              Applied salary{' '}
              {money(model.selected.inputs.colleges[i].startingSalary)} / yr
              <br />
              Applied aid{' '}
              {money(model.selected.inputs.colleges[i].scholarships)} / yr
            </p>
          </div>
        ))}
        <div className="quick-shared">
          <h3>All paths</h3>
          <TrialSlider
            label="Monthly living expense change"
            value={changes.monthlyExpenseChange}
            min={-1000}
            max={1000}
            step={50}
            formatted={`${signedMoney(changes.monthlyExpenseChange)} / mo`}
            onChange={(v) =>
              model.setExploration((p) => ({
                ...p,
                changes: { ...p.changes, monthlyExpenseChange: v },
              }))
            }
          />
          <p className="effective-value">
            Applied living costs
            <br />
            <strong>
              {money(
                model.selected.inputs.assumptions.annualLivingExpenses / 12,
              )}{' '}
              / mo
            </strong>
          </p>
          <p className="trial-caption">
            Adjustments apply after the selected scenario. Original inputs stay
            unchanged.
          </p>
        </div>
      </div>
    </section>
  );
}
