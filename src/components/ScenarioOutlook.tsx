import type { ExplorerModel } from '../state/useExploration';
import { money } from '../lib/utils';
export function ScenarioOutlook({
  model,
  names,
  years,
  origin,
}: {
  model: ExplorerModel;
  names: string[];
  years: number;
  origin: 'enrollment' | 'graduation';
}) {
  return (
    <section className="scenario-outlook" aria-label="All scenario outcomes">
      <div className="section-heading">
        <h2>Three perspectives</h2>
        <span className="quiet-badge">
          NET WORTH · YEAR {years} FROM {origin.toUpperCase()}
        </span>
      </div>
      <div className="scenario-table">
        <table>
          <caption className="sr-only">
            End-of-horizon net worth by scenario.{' '}
            {model.count
              ? 'Includes current quick adjustments.'
              : 'Based on original inputs.'}
          </caption>
          <thead>
            <tr>
              <th scope="col">College</th>
              {model.outlooks.map((s) => (
                <th
                  scope="col"
                  key={s.id}
                  className={
                    s.id === model.exploration.scenario
                      ? 'current-scenario'
                      : ''
                  }
                >
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((name, i) => (
              <tr key={i}>
                <th scope="row">
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
                  {name}
                </th>
                {model.outlooks.map((s) => (
                  <td
                    key={s.id}
                    className={
                      s.id === model.exploration.scenario
                        ? 'current-scenario'
                        : ''
                    }
                  >
                    {money(s.results[i].snapshots.at(-1)!.netWorth)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="trial-caption">
        {model.count > 0 ? 'Includes quick adjustments. ' : ''}Assumption sets,
        not a forecast or a best / worst case.
      </p>
    </section>
  );
}
