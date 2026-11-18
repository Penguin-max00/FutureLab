import type { SimulationResult } from '../engine/types';
import { AnimatedMoney } from '../motion/AnimatedMoney';
import { money } from '../lib/utils';
import './firstBudget.css';

export function FirstBudget({
  results,
  names,
}: {
  results: SimulationResult[];
  names: string[];
}) {
  // Month 0 is graduation, before any income or payments. Use the same
  // month-one snapshots as the ledger, including active scenario changes.
  const months = results.map((result) => result.firstBudget);
  const balances = months.map(
    (month) => month.takeHomeIncome - month.livingExpenses - month.loanPayment,
  );
  const rows = [
    {
      label: 'Take-home pay',
      values: months.map((month) => month.takeHomeIncome),
    },
    {
      label: 'Living costs',
      values: months.map((month) => -month.livingExpenses),
    },
    {
      label: 'Loan payment',
      values: months.map((month) => -month.loanPayment),
    },
  ];
  return (
    <section
      className={`first-budget ${results.length > 2 ? 'multi-budget' : ''}`}
      aria-labelledby="first-budget-title"
    >
      <header className="first-budget-heading">
        <h2 id="first-budget-title">Your first monthly budget</h2>
        <span>Month 1 after graduation</span>
      </header>
      {results.some(
        (result) =>
          result.timelineMode === 'enrollment' &&
          result.graduationMonth >= result.snapshots.length - 1,
      ) && (
        <p className="budget-job-search">
          Graduation is beyond the chart horizon for at least one college. This
          budget still shows each path's first month after graduation.
        </p>
      )}
      {results.some((result) => result.jobSearchMonths > 0) && (
        <p className="budget-job-search">
          Job search ·{' '}
          {results
            .map((result, i) => `${'ABCD'[i]} ${result.jobSearchMonths} months`)
            .join(' · ')}
          . Income starts the following month.
        </p>
      )}
      <div
        className="budget-scroll"
        tabIndex={results.length > 2 ? 0 : undefined}
      >
        <table className="first-budget-table">
          <caption className="sr-only">
            Monthly income and spending for all colleges, using the selected
            scenario. Amounts in USD, rounded to whole dollars.
          </caption>
          <thead>
            <tr>
              <td aria-hidden="true" />
              {names.map((name, i) => (
                <th scope="col" key={i}>
                  <span className={`budget-college color-${i}`}>
                    <b>{'ABCD'[i]}</b>
                    <span title={name}>{name}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.values.map((value, index) => (
                  <td key={index}>
                    <AnimatedMoney value={value === 0 ? 0 : value} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="budget-balance">
              <th scope="row">Left each month</th>
              {balances.map((balance, index) => {
                // Avoid describing a deficit as a rounded $0.
                const shortfall = balance < -0.005;
                return (
                  <td
                    key={index}
                    className={shortfall ? 'budget-shortfall' : ''}
                  >
                    <strong>
                      <AnimatedMoney
                        value={Math.abs(balance) < 0.5 ? 0 : balance}
                      />
                    </strong>
                    <small>
                      {shortfall
                        ? balance > -0.5
                          ? 'Shortfall under $1'
                          : 'Monthly shortfall'
                        : balance < 0.005
                          ? 'Balanced budget'
                          : balance < 0.5
                            ? 'Under $1 left'
                            : 'Available to save or spend'}
                    </small>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <details className="budget-details">
        <summary>Income & tax details</summary>
        <div
          className="budget-scroll"
          tabIndex={results.length > 2 ? 0 : undefined}
        >
          <table className="first-budget-table budget-tax-table">
            <caption className="sr-only">
              Gross income and estimated tax for{' '}
              {names.map((name, i) => `${name} (${'ABCD'[i]})`).join(', ')}.
            </caption>
            <thead className="sr-only">
              <tr>
                <td />
                {names.map((name, i) => (
                  <th scope="col" key={i}>
                    {name} ({'ABCD'[i]})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Gross income</th>
                {months.map((month, index) => (
                  <td key={index}>{money(month.grossIncome)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Estimated tax</th>
                {months.map((month, index) => (
                  <td key={index}>
                    {money(-(month.grossIncome - month.takeHomeIncome) || 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Uses your estimated tax rate and post-graduation living costs,
          separate from college housing costs. Excludes benefits and other
          payroll deductions. Loan payments begin in month 1. Income begins
          after any job-search delay; salary growth starts when work begins.
          Living costs grow from graduation.
        </p>
      </details>
      <p className="budget-footnote">
        USD / month · rounded ·{' '}
        {balances.some((balance) => balance < -0.005)
          ? 'A shortfall draws down cash or requires other funding.'
          : 'Leftover money adds to your simulated cash balance.'}
      </p>
    </section>
  );
}
