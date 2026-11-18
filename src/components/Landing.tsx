import {
  ArrowRight,
  GitCompareArrows,
  SlidersHorizontal,
  ChartNoAxesCombined,
} from 'lucide-react';
import type { SimulationResult } from '../engine/types';
import { Button } from './ui/button';
import { ProjectionChart } from './ProjectionChart';
export function Landing({
  onStart,
  results,
  names,
}: {
  onStart: () => void;
  results: SimulationResult[];
  names: string[];
}) {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" />
            THE COLLEGE DECISION WORKSPACE
          </span>
          <h1>
            Two paths.
            <br />
            <span>More perspective.</span>
          </h1>
          <p className="hero-description">
            Compare college costs.
            <br />
            Explore life after graduation.
          </p>
          <Button onClick={onStart}>
            Start exploring <ArrowRight size={17} />
          </Button>
          <div className="hero-footnote">
            Free. Private. Saved on your device.
          </div>
        </div>
        <div className="hero-preview">
          <div className="preview-toolbar">
            <div className="window-dots">
              <i />
              <i />
              <i />
            </div>
            <span>FUTURELAB / PREVIEW</span>
          </div>
          <ProjectionChart preview results={results} names={names} />
          <div className="preview-bottom">
            <span>
              <i className="live-dot" />
              Live comparison
            </span>
            <span>Illustrative inputs</span>
          </div>
        </div>
      </section>
      <section className="how-section" aria-label="How it works">
        <div className="steps">
          {[
            {
              icon: GitCompareArrows,
              n: '01',
              title: 'Compare',
              text: 'Up to four colleges. One workspace.',
            },
            {
              icon: SlidersHorizontal,
              n: '02',
              title: 'Adjust',
              text: 'Costs, aid, and your assumptions.',
            },
            {
              icon: ChartNoAxesCombined,
              n: '03',
              title: 'Explore',
              text: 'Debt, cash, and the years ahead.',
            },
          ].map((step) => (
            <article key={step.n}>
              <div className="step-top">
                <step.icon size={20} />
                <span>{step.n}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="landing-footer">
        <span>FutureLab</span>
        <span>Possibilities, not predictions.</span>
      </footer>
    </main>
  );
}
