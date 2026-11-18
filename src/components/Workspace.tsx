import { GettingStarted, InputGuide } from './InputGuide';
import { useExploration } from '../state/useExploration';
import { ExperimentBar } from './ExperimentBar';
import { ScenarioOutlook } from './ScenarioOutlook';
import { MetricDelta } from './MetricDelta';
import { AnimatedMoney } from '../motion/AnimatedMoney';
import { MonthlyLedger } from './MonthlyLedger';
import { ModelNotes } from './ModelNotes';
import { useState } from 'react';
import type { College } from '../engine/types';
import {
  ArrowUpRight,
  GitCompareArrows,
  RotateCcw,
  SlidersHorizontal,
  Check,
  ArrowRight,
  Eraser,
  Undo2,
} from 'lucide-react';
import {
  assumptionFields,
  assumptionHints,
  isExampleWorkspace,
  type Workspace as WorkspaceState,
} from '../state/defaults';
import { money } from '../lib/utils';
import { Button } from './ui/button';
import { CollegeEditor } from './CollegeEditor';
import { NumberField } from './NumberField';
import { ProjectionChart } from './ProjectionChart';
import { addCollege, removeLastCollege } from '../state/multiCollege';
import { FirstBudget } from './FirstBudget';
import { SavedPlans } from './SavedPlans';
import { AdvancedAssumptions } from './AdvancedAssumptions';
interface Props {
  workspace: WorkspaceState;
  update: (w: WorkspaceState) => void;
  reset: () => void;
  notice: string;
  showIntro: boolean;
  showHint: boolean;
  hasDraft: boolean;
  startPersonal: () => void;
  dismissIntro: () => void;
  dismissHint: () => void;
}
export function Workspace({
  workspace,
  update,
  reset,
  notice,
  showIntro,
  showHint,
  hasDraft,
  startPersonal,
  dismissIntro,
  dismissHint,
}: Props) {
  const [tab, setTab] = useState<'comparison' | 'assumptions'>('comparison');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState<number | null>(null);
  const [amountsBeforeZero, setAmountsBeforeZero] = useState<College[] | null>(
    null,
  );
  const [amountResetVersion, setAmountResetVersion] = useState(0);
  const allAmountsZero = workspace.colleges.every((college) =>
    [
      college.tuition,
      college.livingCost,
      college.scholarships,
      college.familyContribution,
      college.startingSalary,
    ].every((value) => value === 0),
  );
  function zeroAmounts() {
    if (allAmountsZero) return;
    setAmountsBeforeZero(structuredClone(workspace.colleges));
    update({
      ...workspace,
      colleges: workspace.colleges.map((college) => ({
        ...college,
        tuition: 0,
        livingCost: 0,
        scholarships: 0,
        familyContribution: 0,
        startingSalary: 0,
      })) as WorkspaceState['colleges'],
    });
    setAmountResetVersion((version) => version + 1);
  }
  function undoZeroAmounts() {
    if (!amountsBeforeZero) return;
    update({
      ...workspace,
      colleges: workspace.colleges.map((college, index) => ({
        ...college,
        tuition: amountsBeforeZero[index].tuition,
        livingCost: amountsBeforeZero[index].livingCost,
        scholarships: amountsBeforeZero[index].scholarships,
        familyContribution: amountsBeforeZero[index].familyContribution,
        startingSalary: amountsBeforeZero[index].startingSalary,
      })) as WorkspaceState['colleges'],
    });
    setAmountsBeforeZero(null);
    setAmountResetVersion((version) => version + 1);
  }
  const model = useExploration(workspace);
  const results = model.selected.results;
  const { colleges, assumptions } = workspace;
  const example = isExampleWorkspace(workspace);
  const origin =
    (assumptions.timelineMode ?? 'graduation') === 'enrollment'
      ? 'enrollment'
      : 'graduation';
  const names = colleges.map((c, i) => c.name.trim() || `College ${'ABCD'[i]}`);
  const last = results.map((r) => r.snapshots[r.snapshots.length - 1]);
  const metrics = [
    {
      label: 'Total education cost',
      values: results.map((r) => r.totalCost),
      originals: model.baseline.map((r) => r.totalCost),
      detail: 'After scholarships · all college years',
    },
    {
      label: 'Loan at graduation',
      values: results.map((r) => r.loanPrincipal),
      originals: model.baseline.map((r) => r.loanPrincipal),
      detail: 'After family contribution & savings',
    },
    {
      label: 'Monthly loan payment',
      values: results.map((r) => r.loan.monthlyPayment),
      originals: model.baseline.map((r) => r.loan.monthlyPayment),
      detail: `${assumptions.repaymentYears}-year term · ${(assumptions.interestRate * 100).toFixed(1)}% interest`,
    },
    {
      label: `Net worth · year ${assumptions.horizonYears}`,
      values: last.map((r) => r.netWorth),
      originals: model.baseline.map((r) => r.snapshots.at(-1)!.netWorth),
      detail: `Accumulated cash less remaining debt · ${assumptions.horizonYears} years from ${origin}`,
    },
  ];
  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="sidebar-label">WORKSPACE</div>
        <button
          className={tab === 'comparison' ? 'side-link selected' : 'side-link'}
          onClick={() => setTab('comparison')}
        >
          <GitCompareArrows size={18} />
          Colleges
        </button>
        <button
          className={tab === 'assumptions' ? 'side-link selected' : 'side-link'}
          onClick={() => setTab('assumptions')}
        >
          <SlidersHorizontal size={18} />
          Assumptions
        </button>
        <div className="sidebar-bottom">
          <a className="model-link" href="#model-notes">
            Model & assumptions <ArrowUpRight size={14} />
          </a>
          <span className="local-status">
            <Check size={13} />
            {notice}
          </span>
        </div>
      </aside>
      <div className="workspace-content">
        <div className="workspace-heading">
          <div>
            <h1>Your comparison</h1>
          </div>
          <div className="workspace-header-actions">
            <SavedPlans
              current={{ workspace, exploration: model.exploration }}
              load={(comparison) => {
                update(comparison.workspace);
                setConfirmRemoval(null);
                model.setExploration(comparison.exploration);
                setAmountsBeforeZero(null);
                setAmountResetVersion((version) => version + 1);
              }}
            />
            {!showIntro && (
              <Button variant="outline" size="sm" onClick={startPersonal}>
                {hasDraft ? 'Continue my draft' : 'Use my own inputs'}
              </Button>
            )}
            <div className="reset-area">
              {confirmReset ? (
                <div className="reset-confirm">
                  <span>Restore example inputs?</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      model.clearForExampleReset();
                      reset();
                      setConfirmReset(false);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw size={14} /> Reset example
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="illustration-note">
          <span className="live-dot" />
          <span>
            {example
              ? 'Demo data only · replace any name or amount in Your colleges.'
              : 'Your inputs · check costs and aid against your offer.'}
          </span>
        </div>
        {showIntro && (
          <GettingStarted explore={dismissIntro} start={startPersonal} />
        )}
        <ExperimentBar model={model} names={names} />
        <section
          className="metrics-grid"
          aria-label="College comparison results"
        >
          {metrics.map((m, i) => (
            <article
              className={`metric ${i === 3 ? 'highlight' : ''}`}
              key={i}
              title={m.detail}
            >
              <div className="metric-label">
                {m.label}
                {i === 3 && <ArrowUpRight size={16} />}
              </div>
              <div className="metric-values">
                {m.values.map((v, j) => (
                  <div key={j}>
                    <span className={`tiny-letter color-${j}`}>
                      {'ABCD'[j]}
                    </span>
                    <strong>
                      <AnimatedMoney value={v} />
                    </strong>
                    {model.active && (
                      <MetricDelta value={v} original={m.originals[j]} />
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
        <div className="main-grid">
          <div className="inputs-section">
            <div className="section-heading">
              <h2>
                {tab === 'comparison'
                  ? model.active
                    ? 'Original college inputs'
                    : 'Your colleges'
                  : 'Original shared assumptions'}
              </h2>
              {tab === 'comparison' ? (
                <div className="college-section-actions">
                  {confirmRemoval === colleges.length && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmRemoval(null)}
                    >
                      Cancel
                    </Button>
                  )}
                  {colleges.length < 4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        update(addCollege(workspace));
                        setConfirmRemoval(null);
                        setAmountsBeforeZero(null);
                      }}
                    >
                      + Add college
                    </Button>
                  )}
                  {colleges.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirmRemoval !== colleges.length) {
                          setConfirmRemoval(colleges.length);
                          return;
                        }
                        setConfirmRemoval(null);
                        const index = colleges.length - 1;
                        update(removeLastCollege(workspace));
                        model.setExploration((previous) => ({
                          ...previous,
                          changes: {
                            ...previous.changes,
                            extraAid: previous.changes.extraAid.slice(0, index),
                            salaryChange: previous.changes.salaryChange.slice(
                              0,
                              index,
                            ),
                          },
                        }));
                        setAmountsBeforeZero(null);
                      }}
                    >
                      {confirmRemoval === colleges.length
                        ? 'Confirm remove'
                        : 'Remove'}{' '}
                      {'ABCD'[colleges.length - 1]}
                    </Button>
                  )}

                  {amountsBeforeZero && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={undoZeroAmounts}
                      aria-label="Undo zeroing college amounts"
                    >
                      <Undo2 size={13} />
                      Undo
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zeroAmounts}
                    disabled={allAmountsZero}
                    title="Set tuition, living costs, scholarships, family contribution, and starting salary to zero for all colleges"
                  >
                    <Eraser size={13} />
                    Zero amounts
                  </Button>
                </div>
              ) : (
                <span className="quiet-badge">APPLIES TO BOTH</span>
              )}
            </div>
            {tab === 'comparison' && amountsBeforeZero && (
              <p className="amount-reset-status" role="status">
                {allAmountsZero
                  ? 'All college amounts are now 0.'
                  : 'Previous amounts are available to restore.'}{' '}
                Undo restores their previous amounts.
              </p>
            )}
            {tab === 'comparison' && showHint && (
              <InputGuide dismiss={dismissHint} />
            )}
            <div key={`${tab}-${amountResetVersion}`} className="panel-stage">
              {tab === 'comparison' ? (
                <div className="college-grid">
                  {colleges.map((c, i) => (
                    <CollegeEditor
                      key={`${c.id}-${i}-${amountResetVersion}`}
                      college={c}
                      index={i}
                      example={example}
                      update={(college) => {
                        const next: WorkspaceState['colleges'] = [...colleges];
                        next[i] = college;
                        update({ ...workspace, colleges: next });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <section className="assumptions-panel">
                  <p>
                    {model.active
                      ? 'Scenarios and quick adjustments apply on top of these inputs.'
                      : 'Shared financial assumptions. Career paths can differ.'}
                  </p>
                  <div className="assumptions-grid">
                    {assumptionFields.map(([key, label, min, max, unit]) => (
                      <NumberField
                        key={key}
                        label={label}
                        value={assumptions[key]}
                        min={min}
                        max={max}
                        unit={unit}
                        hint={assumptionHints[key]}
                        onChange={(v) =>
                          update({
                            ...workspace,
                            assumptions: { ...assumptions, [key]: v },
                          })
                        }
                      />
                    ))}
                  </div>
                  <AdvancedAssumptions
                    attendanceYears={colleges.map(
                      (college) => college.yearsOfAttendance,
                    )}
                    assumptions={assumptions}
                    update={(next) =>
                      update({ ...workspace, assumptions: next })
                    }
                  />
                  {results.some((result) => result.inSchoolInterest > 0) && (
                    <p className="education-interest-note">
                      In-school interest added at graduation ·{' '}
                      {results
                        .map(
                          (result, i) =>
                            `${'ABCD'[i]} ${money(result.inSchoolInterest)}`,
                        )
                        .join(' · ')}
                    </p>
                  )}
                </section>
              )}
            </div>
            <button
              className="next-section"
              onClick={() =>
                setTab(tab === 'comparison' ? 'assumptions' : 'comparison')
              }
            >
              {tab === 'comparison' ? 'Edit assumptions' : 'Back to colleges'}
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="results-section">
            <ProjectionChart results={results} names={names} />
            <FirstBudget results={results} names={names} />
            <div className="outcome-strip">
              {last.map((r, i) => (
                <div key={i}>
                  <span>
                    <i
                      className="dot"
                      style={{
                        background: [
                          'var(--accent)',
                          'var(--accent-b)',
                          'var(--college-c)',
                          'var(--college-d)',
                        ][i],
                      }}
                    />
                    Cash · year {assumptions.horizonYears} · {'ABCD'[i]}
                  </span>
                  <strong>
                    <AnimatedMoney value={r.accumulatedCash} />
                  </strong>
                  <small>{money(r.remainingLoanBalance)} debt remaining</small>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ScenarioOutlook
          model={model}
          names={names}
          years={assumptions.horizonYears}
          origin={origin}
        />
        <div className="projection-caption">
          Showing {model.selected.label.toLowerCase()}
          {model.count > 0 ? ' + quick adjustments' : ''} projections from{' '}
          {origin}.
        </div>
        <MonthlyLedger results={results} names={names} />
        <ModelNotes />
        <footer className="workspace-footer">
          <span>Calculated on your device.</span>
          <span>Possibilities, not predictions.</span>
        </footer>
      </div>
    </main>
  );
}
