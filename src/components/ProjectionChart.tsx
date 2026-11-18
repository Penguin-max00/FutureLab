import { useState } from 'react';
import { useMotion } from '../motion/MotionProvider';
import { SegmentedControl } from '../motion/SegmentedControl';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import type { SimulationResult } from '../engine/types';
import { money } from '../lib/utils';
export type Metric = 'netWorth' | 'accumulatedCash' | 'remainingLoanBalance';
const metrics: { key: Metric; label: string }[] = [
  { key: 'netWorth', label: 'Net worth' },
  { key: 'accumulatedCash', label: 'Cash balance' },
  { key: 'remainingLoanBalance', label: 'Loan balance' },
];
export function ProjectionChart({
  results,
  names,
  preview = false,
}: {
  results: SimulationResult[];
  names: string[];
  preview?: boolean;
}) {
  const { enabled } = useMotion();
  const [metric, setMetric] = useState<Metric>('netWorth');
  const [animate, setAnimate] = useState(false);
  const enrollment = results[0].timelineMode === 'enrollment';
  const years = results[0].snapshots.at(-1)!.month / 12;
  const tickStep = Math.max(1, Math.ceil(years / 5));
  const ticks = [
    ...new Set([
      ...Array.from(
        { length: Math.floor(years / tickStep) + 1 },
        (_, i) => i * tickStep,
      ),
      years,
    ]),
  ];
  const colors = [
    'var(--accent)',
    'var(--accent-b)',
    'var(--college-c)',
    'var(--college-d)',
  ];
  const dashes = [undefined, '6 4', '2 3', '10 3 2 3'];
  const data = results[0].snapshots.map((p) => ({
    year: p.month / 12,
    ...Object.fromEntries(
      results.map((result, i) => [
        `college${i}`,
        result.snapshots[p.month][metric],
      ]),
    ),
  }));
  return (
    <section
      className={`projection ${preview ? 'preview-chart' : ''}`}
      aria-label="Financial projection chart"
    >
      <div className="chart-header">
        <div>
          <h2>
            {preview
              ? 'The long view'
              : enrollment
                ? 'From enrollment'
                : 'After graduation'}
          </h2>
        </div>
        {!preview && (
          <span className="quiet-badge">{years}-year projection</span>
        )}
      </div>
      <div className="chart-controls">
        <SegmentedControl
          label="Chart metric"
          value={metric}
          onChange={(next) => {
            setAnimate(true);
            setMetric(next);
          }}
          options={metrics.map((m) => ({ value: m.key, label: m.label }))}
        />
      </div>
      <div
        className="chart-canvas"
        role="img"
        aria-label={`${metrics.find((m) => m.key === metric)?.label} over ${years} years from ${enrollment ? 'enrollment' : 'graduation'} for ${names.join(' and ')}. Exact values are available in the results and monthly ledger.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 15, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              type="number"
              domain={[0, years]}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={(v) => `Yr ${v}`}
              minTickGap={28}
            />
            <YAxis
              width={58}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={(v) => money(v, true)}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--glass-surface)',
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 12,
              }}
              formatter={(v, name) => [money(Number(v)), name]}
              labelFormatter={(v) =>
                `Month ${Math.round(Number(v) * 12)} from ${enrollment ? 'enrollment' : 'graduation'}`
              }
            />
            <ReferenceLine y={0} stroke="var(--chart-zero)" />
            {enrollment &&
              [...new Set(results.map((result) => result.graduationMonth / 12))]
                .filter((year) => year <= years)
                .map((year) => (
                  <ReferenceLine
                    key={year}
                    x={year}
                    stroke="var(--text-muted)"
                    strokeDasharray="2 5"
                    label={{
                      value: `Grad ${results
                        .map((result, i) =>
                          result.graduationMonth / 12 === year ? 'ABCD'[i] : '',
                        )
                        .filter(Boolean)
                        .join(' / ')}`,
                      fill: 'var(--text-muted)',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                ))}
            {results.map((_, i) => (
              <Line
                key={i}
                type="linear"
                dataKey={`college${i}`}
                name={`${'ABCD'[i]} · ${names[i]}`}
                stroke={colors[i]}
                strokeWidth={2.5}
                strokeDasharray={dashes[i]}
                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive={enabled && animate}
                animationDuration={400}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {names.map((name, i) => (
          <span key={i}>
            <i className="dot" style={{ background: colors[i] }} />
            {'ABCD'[i]} · {name}
          </span>
        ))}
        <span className="chart-axis-note">
          Years from {enrollment ? 'enrollment' : 'graduation'}
        </span>
      </div>
    </section>
  );
}
