import { useEffect, type RefObject } from 'react';
/** Update only the two decorative layers; pointer movement never re-renders the app. */
export function usePointerHalo(
  layers: RefObject<HTMLDivElement | null>[],
  active: boolean,
) {
  useEffect(() => {
    const elements = layers
      .map((layer) => layer.current)
      .filter((element): element is HTMLDivElement => element !== null);
    if (!active) return;
    let frame = 0;
    let initialized = false;
    let x = 0,
      y = 0,
      targetX = 0,
      targetY = 0,
      lastTime = 0;
    const position = () =>
      elements.forEach((element) => {
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    function tick(time: number) {
      const blend =
        1 - Math.exp(-Math.max(0, Math.min(time - lastTime, 64)) / 75);
      lastTime = time;
      x += (targetX - x) * blend;
      y += (targetY - y) * blend;
      if (Math.hypot(targetX - x, targetY - y) < 0.15) {
        x = targetX;
        y = targetY;
        position();
        frame = 0;
        return;
      }
      position();
      frame = requestAnimationFrame(tick);
    }
    function move(event: PointerEvent) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!initialized) {
        x = targetX;
        y = targetY;
        initialized = true;
        position();
      }
      elements.forEach((element) => {
        element.dataset.visible = 'true';
      });
      if (!frame) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    function hide() {
      cancelAnimationFrame(frame);
      frame = 0;
      initialized = false;
      elements.forEach((element) => {
        element.dataset.visible = 'false';
      });
    }
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', hide);
      hide();
    };
  }, [layers, active]);
}
