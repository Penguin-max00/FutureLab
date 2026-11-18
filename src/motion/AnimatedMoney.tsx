import { useEffect, useRef, useState } from 'react';
import { money } from '../lib/utils';
import { useMotion } from './MotionProvider';
export function AnimatedMoney({ value }: { value: number }) {
  const { enabled } = useMotion();
  const current = useRef(value);
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (!enabled) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const from = current.current;
    if (from === value) return;
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / 480);
      current.current = from + (value - from) * (1 - (1 - progress) ** 4);
      setDisplay(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, enabled]);
  return (
    <span className="animated-money" aria-label={money(value)}>
      <span aria-hidden="true">{money(enabled ? display : value)}</span>
    </span>
  );
}
