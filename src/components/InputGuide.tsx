import { ArrowRight, X } from 'lucide-react';
import { Button } from './ui/button';
export function GettingStarted({
  explore,
  start,
}: {
  explore: () => void;
  start: () => void;
}) {
  return (
    <section className="getting-started" aria-label="Choose how to get started">
      <div>
        <h2>Start with an example. Make it yours.</h2>
        <p>
          The names and numbers below are just examples, not recommendations.
          Click any name or amount in Your colleges to edit. Results update
          instantly.
        </p>
      </div>
      <div>
        <Button size="sm" variant="ghost" onClick={explore}>
          Explore example
        </Button>
        <Button size="sm" onClick={start}>
          Use my own inputs
          <ArrowRight size={14} />
        </Button>
      </div>
    </section>
  );
}
export function InputGuide({ dismiss }: { dismiss: () => void }) {
  return (
    <div className="input-guide">
      <p>
        Click a college name or any value to edit. Amounts are annual unless
        marked “total”.
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss input guide">
        <X size={13} />
      </button>
    </div>
  );
}
