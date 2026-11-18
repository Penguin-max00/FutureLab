import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (callback: () => void) => {
  preference.addEventListener('change', callback);
  return () => preference.removeEventListener('change', callback);
};
const MotionContext = createContext({ enabled: true });
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useSyncExternalStore(subscribe, () => preference.matches);
  return (
    <MotionContext.Provider value={{ enabled: !reduced }}>
      <div className="app-shell" data-motion={reduced ? 'reduced' : 'full'}>
        {children}
      </div>
    </MotionContext.Provider>
  );
}
export const useMotion = () => useContext(MotionContext);
