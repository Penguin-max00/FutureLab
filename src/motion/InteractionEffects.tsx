import { useEffect, useRef } from 'react';
import { useMotion } from './MotionProvider';
/** A separate compositor overlay keeps click feedback out of React's workspace render path. */
export function InteractionEffects() {
  const { enabled } = useMotion();
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const active = new Set<Animation>();
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest('button, summary, a');
      if (
        !(control instanceof HTMLElement) ||
        control.matches(':disabled, [aria-disabled="true"]')
      )
        return;
      const rect = control.getBoundingClientRect();
      const ring = document.createElement('span');
      ring.className = 'interaction-ring';
      // Keyboard activation has no pointer coordinates; originate at the control's center.
      const x = event.detail === 0 ? rect.left + rect.width / 2 : event.clientX;
      const y = event.detail === 0 ? rect.top + rect.height / 2 : event.clientY;
      const size = Math.min(100, Math.max(36, rect.width * 0.55));
      Object.assign(ring.style, {
        left: `${x - size / 2}px`,
        top: `${y - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
      });
      layer.current?.append(ring);
      const animation = ring.animate(
        [
          { transform: 'scale(.25)', opacity: 0.6 },
          { transform: 'scale(1.4)', opacity: 0 },
        ],
        { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
      active.add(animation);
      const dispose = () => {
        ring.remove();
        active.delete(animation);
      };
      animation.onfinish = dispose;
      animation.oncancel = dispose;
    }
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('click', click, true);
      active.forEach((animation) => animation.cancel());
    };
  }, [enabled]);
  return <div ref={layer} className="interaction-layer" aria-hidden="true" />;
}
