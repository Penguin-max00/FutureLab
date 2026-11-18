import { useState } from 'react';
import { FlaskConical, RotateCcw, ChevronDown } from 'lucide-react';
import type { ExplorerModel } from '../state/useExploration';
import { scenarios } from '../engine/experiments';
import { SegmentedControl } from '../motion/SegmentedControl';
import { Button } from './ui/button';
import { QuickWhatIf } from './QuickWhatIf';
import { money } from '../lib/utils';
const descriptions = {
  baseline: 'Your original salary and expense assumptions.',
  optimistic:
    'Starting salary +10% · salary growth +1 pp · living costs −10% · expense growth −1 pp.',
  conservative:
    'Starting salary −10% · salary growth −1 pp · living costs +10% · expense growth +1 pp.',
};
export function ExperimentBar({
  model,
  names,
}: {
  model: ExplorerModel;
  names: string[];
}) {
  const [open, setOpen] = useState(model.count > 0);
  const rates = model.selected.inputs.assumptions;
  return (
    <section
      className="experiment-section"
      aria-label="Scenario and what-if experiments"
    >
      <div className="experiment-toolbar">
        <div className="scenario-picker">
          <span className="experiment-label">SCENARIO</span>
          <SegmentedControl
            label="Financial scenario"
            value={model.exploration.scenario}
            onChange={(scenario) =>
              model.setExploration((p) => ({ ...p, scenario }))
            }
            options={scenarios.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>
        <div className="experiment-actions">
          {model.active && (
            <Button size="sm" variant="ghost" onClick={model.clearAll}>
              <RotateCcw size={13} />
              Back to original
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            aria-expanded={open}
            aria-controls="quick-what-if"
            onClick={() => setOpen(!open)}
          >
            <FlaskConical size={14} />
            Quick what-if
            {model.count > 0 && (
              <span className="change-badge">{model.count}</span>
            )}
            <ChevronDown size={13} className={open ? 'chevron-open' : ''} />
          </Button>
        </div>
      </div>
      <div className="experiment-context">
        <p>
          {descriptions[model.exploration.scenario]}
          {model.count > 0 && ' Quick adjustments included.'}
        </p>
        <span>
          {model.active
            ? 'Deltas vs original baseline'
            : 'Deterministic scenarios · not probabilities'}
        </span>
      </div>
      <details className="scenario-assumptions">
        <summary>
          Applied assumptions <ChevronDown size={12} />
        </summary>
        <div>
          <span>
            Salary growth{' '}
            <strong>{(rates.salaryGrowth * 100).toFixed(1)}% / yr</strong>
          </span>
          <span>
            Expense growth{' '}
            <strong>{(rates.expenseGrowth * 100).toFixed(1)}% / yr</strong>
          </span>
          <span>
            Living expenses{' '}
            <strong>{money(rates.annualLivingExpenses)} / yr</strong>
          </span>
          <span>
            pp = percentage points. Loan rate, repayment term, tax, tuition, and
            attendance stay at your original inputs.
          </span>
        </div>
      </details>
      {model.selected.limits.length > 0 && (
        <p className="experiment-limit" role="status">
          Input limits reached: {model.selected.limits.join(', ')}. Applied
          values are shown in the trial controls and assumptions.
        </p>
      )}
      {model.storageError && (
        <p className="experiment-limit" role="status">
          Experiment storage unavailable. These changes last for this session.
        </p>
      )}
      {open && <QuickWhatIf model={model} names={names} />}
    </section>
  );
}
