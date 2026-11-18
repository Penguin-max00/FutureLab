import { SegmentedControl } from '../motion/SegmentedControl';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SimulationResult } from '../engine/types';
import { money } from '../lib/utils';
export function MonthlyLedger({
  results,
  names,
}: {
  results: SimulationResult[];
  names: string[];
}) {
  const [selected, setSelected] = useState(0);
  const enrollment = results[selected].timelineMode === 'enrollment';
  return (
    <details className="ledger">
      <summary>
        Monthly ledger{' '}
        <span>
          View details <ChevronDown size={15} />
        </span>
      </summary>
      <div className="ledger-inner">
        <SegmentedControl
          label="College ledger"
          value={selected}
          onChange={setSelected}
          options={names.map((name, i) => ({ value: i, label: name }))}
        />
        <div className="table-scroll panel-stage" key={selected}>
          <table>
            <caption>
              Monthly projection for {names[selected]}. Month 0 is{' '}
              {enrollment ? 'enrollment' : 'graduation'}; all amounts in USD.{' '}
              {enrollment
                ? `Graduation: month ${results[selected].graduationMonth}. College funding (family funds + borrowing) directly covers annual college costs at the start of each academic year.`
                : ''}
            </caption>
            <thead>
              <tr>
                {[
                  'Month',
                  'Stage',
                  ...(enrollment ? ['College funding', 'College costs'] : []),
                  'Gross income',
                  'Take-home',
                  'Living costs',
                  'Loan payment',
                  'Cash balance',
                  'Loan balance',
                  'Net worth',
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results[selected].snapshots.map((r) => (
                <tr key={r.month}>
                  <td>{r.month}</td>
                  <td>
                    {r.phase ?? (r.month === 0 ? 'graduation' : 'working')}
                  </td>
                  {[
                    ...(enrollment
                      ? [r.educationFunding ?? 0, r.educationCost ?? 0]
                      : []),
                    r.grossIncome,
                    r.takeHomeIncome,
                    r.livingExpenses,
                    r.loanPayment,
                    r.accumulatedCash,
                    r.remainingLoanBalance,
                    r.netWorth,
                  ].map((v, i) => (
                    <td key={i}>{money(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
