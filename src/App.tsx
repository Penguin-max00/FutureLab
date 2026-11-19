import { PersonalSetup } from './components/PersonalSetup';
import { clearStoredExploration } from './state/useExploration';
import { Activity, useLayoutEffect, useMemo, useState } from 'react';
import { AmbientBackground } from './motion/AmbientBackground';
import { InteractionEffects } from './motion/InteractionEffects';
import { ArrowUpRight, FlaskConical, GitCompareArrows } from 'lucide-react';
import { simulate } from './engine/simulation';
import type { SimulationResult } from './engine/types';
import { useWorkspace } from './state/useWorkspace';
import { Landing } from './components/Landing';
import { Workspace } from './components/Workspace';
import { QuickEstimate } from './components/QuickEstimate';
import { ThemeToggle } from './theme/ThemeToggle';
import { Button } from './components/ui/button';
export default function App() {
  const [view, setView] = useState<'home' | 'workspace' | 'quick'>(() =>
    location.hash === '#quick-estimate'
      ? 'quick'
      : ['#explore', '#model-notes'].includes(location.hash)
        ? 'workspace'
        : 'home',
  );
  const session = useWorkspace();
  const { workspace, setWorkspace, reset, notice } = session;
  const [resetVersion, setResetVersion] = useState(0);
  const results = useMemo(
    () =>
      workspace.colleges.map((c, i) =>
        simulate(c, workspace.assumptions, i),
      ) as SimulationResult[],
    [workspace],
  );
  function navigate(next: 'home' | 'workspace' | 'quick') {
    if (next === view) return;
    setView(next);
    history.replaceState(
      null,
      '',
      next === 'workspace'
        ? '#explore'
        : next === 'quick'
          ? '#quick-estimate'
          : location.pathname,
    );
  }
  // Reset scroll after the destination DOM commits, before the browser paints.
  // This avoids a separate scroll jump during an asynchronous page snapshot.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);
  return (
    <>
      <AmbientBackground />
      <InteractionEffects />
      <ThemeToggle />
      <header className="topbar">
        <button
          className="brand"
          aria-label="FutureLab home"
          onClick={() => navigate('home')}
        >
          <span className="brand-mark">
            <FlaskConical size={20} strokeWidth={1.7} />
          </span>
          Future<span>Lab</span>
          <span className="beta">BETA</span>
        </button>
        <nav aria-label="Main navigation">
          <button
            aria-current={view === 'home' ? 'page' : undefined}
            className={view === 'home' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('home')}
          >
            Overview
          </button>
          <button
            aria-current={view === 'workspace' ? 'page' : undefined}
            className={view === 'workspace' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('workspace')}
          >
            Main Workspace
          </button>
          <button
            aria-current={view === 'quick' ? 'page' : undefined}
            className={view === 'quick' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('quick')}
          >
            Quick Estimate
          </button>
        </nav>
        <div className="topbar-end">
          <span className="design-credit">Design By Ruiwen</span>
          {view === 'home' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('workspace')}
            >
              Open workspace <ArrowUpRight size={15} />
            </Button>
          ) : (
            <span className="workspace-indicator">
              <GitCompareArrows size={15} />
              {view === 'quick' ? 'A simpler first look' : 'College comparison'}
            </span>
          )}
        </div>
      </header>
      <div className="page-stage">
        <Activity mode={view === 'home' ? 'visible' : 'hidden'}>
          <Landing
            onStart={() => navigate('workspace')}
            results={results}
            names={workspace.colleges.map((c) => c.name)}
          />
        </Activity>
        <Activity mode={view === 'workspace' ? 'visible' : 'hidden'}>
          {session.editingDraft && session.draft ? (
            <PersonalSetup
              draft={session.draft}
              update={session.setDraft}
              notice={notice}
              cancel={session.cancelPersonal}
              complete={() => {
                if (session.finishPersonal()) {
                  clearStoredExploration();
                  setResetVersion((v) => v + 1);
                }
              }}
            />
          ) : (
            <Workspace
              key={resetVersion}
              workspace={workspace}
              update={setWorkspace}
              reset={() => {
                reset();
                setResetVersion((v) => v + 1);
              }}
              notice={notice}
              showIntro={session.showIntro}
              showHint={session.showHint}
              hasDraft={session.hasDraft}
              startPersonal={session.startPersonal}
              dismissIntro={session.dismissIntro}
              dismissHint={session.dismissHint}
            />
          )}
        </Activity>
        <Activity mode={view === 'quick' ? 'visible' : 'hidden'}>
          <QuickEstimate onOpenWorkspace={() => navigate('workspace')} />
        </Activity>
      </div>
    </>
  );
}
