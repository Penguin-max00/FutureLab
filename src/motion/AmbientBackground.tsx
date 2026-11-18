import { useMemo, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useMotion } from './MotionProvider';
import { usePointerHalo } from './usePointerHalo';
const subscribeToVisibility = (callback: () => void) => {
  document.addEventListener('visibilitychange', callback);
  return () => document.removeEventListener('visibilitychange', callback);
};
const isVisible = () => document.visibilityState === 'visible';
/** Decorative layers animate independently of the application and financial results. */
export function AmbientBackground() {
  const { enabled } = useMotion();
  const visible = useSyncExternalStore(subscribeToVisibility, isVisible);
  const halo = useRef<HTMLDivElement>(null);
  const reflection = useRef<HTMLDivElement>(null);
  const layers = useMemo(() => [halo, reflection], []);
  usePointerHalo(layers, enabled && visible);
  return (
    <>
      {createPortal(
        <div
          className="ambient-background"
          aria-hidden="true"
          data-motion={enabled ? 'full' : 'reduced'}
          data-running={enabled && visible}
        >
          <div className="ambient-wash ambient-primary" />
          <div className="ambient-wash ambient-secondary" />
          <div ref={halo} className="pointer-halo" data-visible="false" />
        </div>,
        document.body,
      )}
      <div className="pointer-reflection-layer" aria-hidden="true">
        <div
          ref={reflection}
          className="pointer-reflection"
          data-visible="false"
        />
      </div>
    </>
  );
}
