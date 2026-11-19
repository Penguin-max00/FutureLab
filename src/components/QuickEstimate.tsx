import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  House,
  Pencil,
  RotateCcw,
  Sparkles,
  Undo2,
} from 'lucide-react';
import {
  estimateQuick,
  isQuickInputs,
  quickDefaults,
  quickLimits,
  type QuickInputs,
} from '../engine/quickEstimate';
import { money } from '../lib/utils';
import { AnimatedMoney } from '../motion/AnimatedMoney';
import { Button } from './ui/button';
import { NumberField } from './NumberField';
import { ProjectionChart } from './ProjectionChart';

const storageKey = 'futurelab.quick-estimate.v1';
const namesStorageKey = 'futurelab.quick-estimate.names.v1';
const defaultNames = ['College A', 'College B'];

function restoreNames(): string[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(namesStorageKey) ?? 'null',
    );
    if (
      Array.isArray(saved) &&
      saved.length === 2 &&
      saved.every((name) => typeof name === 'string' && name.length <= 80)
    )
      return saved;
  } catch {
    // Names remain editable without browser storage.
  }
  return [...defaultNames];
}

function restoreInputs(): QuickInputs {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(storageKey) ?? 'null',
    );
    if (isQuickInputs(saved)) return saved;
  } catch {
    // Browsers without storage still support an in-memory estimate.
  }
  return { ...quickDefaults };
}

export function QuickEstimate({
  onOpenWorkspace,
}: {
  onOpenWorkspace: () => void;
}) {
  const [inputs, setInputs] = useState(restoreInputs);
  const [names, setNames] = useState(restoreNames);
  const [undoInputs, setUndoInputs] = useState<QuickInputs | null>(null);
  const [inputVersion, setInputVersion] = useState(0);
  const displayNames = names.map(
    (name, index) => name.trim() || defaultNames[index],
  );
  const allZero = Object.values(inputs).every((value) => value === 0);
  const results = useMemo(() => estimateQuick(inputs), [inputs]);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(inputs));
    } catch {
      // Keep editing available if device storage is disabled or full.
    }
  }, [inputs]);
  useEffect(() => {
    try {
      localStorage.setItem(namesStorageKey, JSON.stringify(names));
    } catch {
      // Keep the in-memory names if storage is unavailable.
    }
  }, [names]);

  function update(key: keyof QuickInputs, value: number | null) {
    setUndoInputs(null);
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function zeroAmounts() {
    if (allZero) return;
    setUndoInputs({ ...inputs });
    setInputs({ debtA: 0, salaryA: 0, debtB: 0, salaryB: 0, monthlyLiving: 0 });
    // Reset local NumberField drafts as well, including empty or invalid edits.
    setInputVersion((version) => version + 1);
  }

  function undoZero() {
    if (!undoInputs) return;
    setInputs(undoInputs);
    setUndoInputs(null);
    setInputVersion((version) => version + 1);
  }

  function rename(index: number, name: string) {
    setNames((current) =>
      current.map((value, i) => (i === index ? name : value)),
    );
  }

  return (
    <main className="quick-estimate">
      <header className="quick-heading">
        <div>
          <span className="quick-kicker">
            <Sparkles size={15} aria-hidden="true" /> THE SIMPLE VIEW
          </span>
          <h1>A little input. A clearer picture.</h1>
          <p>Two colleges. Five numbers. Your next 10 years.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenWorkspace}>
          Open full workspace
        </Button>
      </header>

      <div className="quick-grid">
        <section className="quick-inputs" aria-labelledby="quick-input-title">
          <div className="quick-input-intro">
            <h2 id="quick-input-title">Start with the basics</h2>
            <p>Example names and amounts. Make them yours.</p>
            <div className="quick-input-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={zeroAmounts}
                disabled={allZero}
                title="Set all five amounts to zero. Keep college names."
              >
                <RotateCcw size={14} aria-hidden="true" /> Zero amounts
              </Button>
              {undoInputs && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undoZero}
                  aria-label="Undo zeroing quick estimate amounts"
                >
                  <Undo2 size={14} aria-hidden="true" /> Undo
                </Button>
              )}
            </div>
            <span className="sr-only" role="status">
              {undoInputs
                ? 'All five amounts set to zero. Undo is available.'
                : ''}
            </span>
          </div>
          {(['A', 'B'] as const).map((letter, index) => (
            <fieldset
              className={`quick-college quick-college-${index}`}
              key={`${letter}-${inputVersion}`}
              aria-label={`College ${letter}`}
            >
              <legend>
                <span>{letter}</span>
                <div className="quick-name-shell">
                  <input
                    className="quick-college-name"
                    aria-label={`College ${letter} name`}
                    maxLength={80}
                    value={names[index]}
                    placeholder={defaultNames[index]}
                    title="Click to rename this college"
                    onChange={(event) => rename(index, event.target.value)}
                    onBlur={(event) =>
                      rename(
                        index,
                        event.target.value.trim() || defaultNames[index],
                      )
                    }
                  />
                  <Pencil size={13} aria-hidden="true" />
                </div>
              </legend>
              <div className="quick-fields">
                <NumberField
                  label="Debt at graduation"
                  value={inputs[`debt${letter}`]}
                  min={0}
                  max={quickLimits[`debt${letter}`]}
                  unit="total"
                  placeholder="e.g. 56000"
                  hint="Total loan balance when you graduate, after scholarships and family funding. Enter 0 for no debt."
                  onChange={(value) => update(`debt${letter}`, value)}
                  onEmpty={() => update(`debt${letter}`, null)}
                />
                <NumberField
                  label="Starting salary"
                  value={inputs[`salary${letter}`]}
                  min={0}
                  max={quickLimits[`salary${letter}`]}
                  unit="year"
                  placeholder="e.g. 62000"
                  hint="Your expected annual salary before tax, starting immediately after graduation."
                  onChange={(value) => update(`salary${letter}`, value)}
                  onEmpty={() => update(`salary${letter}`, null)}
                />
              </div>
            </fieldset>
          ))}
          <div className="quick-living">
            <House size={18} aria-hidden="true" />
            <NumberField
              key={inputVersion}
              label="Monthly living expenses"
              value={inputs.monthlyLiving}
              min={0}
              max={quickLimits.monthlyLiving}
              unit="month"
              placeholder="e.g. 2500"
              hint="The same starting monthly budget for both colleges, excluding loan payments."
              onChange={(value) => update('monthlyLiving', value)}
              onEmpty={() => update('monthlyLiving', null)}
            />
          </div>
        </section>

        <section className="quick-results" aria-label="Quick estimate results">
          {results ? (
            <>
              <ProjectionChart results={results} names={displayNames} simple />
              <div className="quick-outcomes">
                <h2>Net worth at year 10</h2>
                <p>Cash saved, minus remaining debt.</p>
                <div className="quick-amounts">
                  {results.map((result, index) => (
                    <div
                      className={`quick-outcome quick-college-${index}`}
                      key={index}
                    >
                      <span>{displayNames[index]}</span>
                      <strong>
                        <AnimatedMoney
                          value={result.snapshots.at(-1)!.netWorth}
                        />
                      </strong>
                      <small>
                        Loan payment {money(result.loan.monthlyPayment)} / mo
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="quick-empty" role="status">
              <Sparkles size={28} aria-hidden="true" />
              <h2>Your picture starts here.</h2>
              <p>
                Complete the five amounts to see your chart. Zero is welcome.
              </p>
            </div>
          )}
          <details className="quick-assumptions">
            <summary>
              What’s behind this estimate?
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <p>
              6.5% loan interest · 10-year repayment · 22% effective tax · 3%
              yearly salary growth · 2.5% yearly living-cost growth. Both paths
              start work at graduation with no savings. Negative values show a
              funding gap. An illustration, not a forecast.
            </p>
          </details>
        </section>
      </div>
      <footer className="quick-footer">
        A first look, at your pace. These inputs are separate from Main
        Workspace.
      </footer>
    </main>
  );
}
