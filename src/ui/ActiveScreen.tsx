import type { SessionState } from '../engine/session';
import type { Workout } from '../domain/types';
import { TimerRing } from './TimerRing';
import { sessionMoves, currentMoveIndex } from './format';

const CAT: Record<string, string> = { warmup: 'Warm-up', push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility' };

interface Props {
  state: SessionState; workout: Workout;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
}

export function ActiveScreen({ state, workout, onPause, onResume, onSkip, onEnd }: Props) {
  const seg = state.segment;
  const isRest = seg?.kind === 'rest';
  const moves = sessionMoves(workout);
  const mi = currentMoveIndex(moves, state.segmentIndex);
  const move = moves[mi];
  const next = moves[mi + 1];
  const title = isRest ? 'Rest' : seg?.exercise?.name ?? 'Get ready';

  return (
    <main className="screen" style={{ display: 'flex', flexDirection: 'column', background: isRest ? '#eef3fb' : 'var(--bg)' }}>
      <p className="sr-only" aria-live="assertive">Now: {title}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ flex: 1, height: 7, background: '#e7def2', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${Math.round(((mi + 1) / moves.length) * 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Move {mi + 1} of {moves.length}</div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 7 }}>
        {!isRest && seg?.exercise && <span className="pill">{CAT[seg.exercise.category] ?? seg.exercise.category}</span>}
      </div>
      <div style={{ textAlign: 'center', fontSize: 27, fontWeight: 500, letterSpacing: '-.3px', marginBottom: 7 }}>{title}</div>
      {!isRest && move && (
        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{move.target}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 18px' }}>
        <TimerRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} />
      </div>

      {next && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', marginBottom: 18 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)' }}><i className="ti ti-arrow-right" aria-hidden="true" /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>Next up</div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{next.exercise.name}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>{CAT[next.category] ?? next.category}<br />{next.target}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 9, marginTop: 'auto' }}>
        {state.status === 'paused'
          ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={onResume}><i className="ti ti-player-play" aria-hidden="true" />Resume</button>
          : <button className="btn btn-primary" style={{ flex: 1 }} onClick={onPause}><i className="ti ti-player-pause" aria-hidden="true" />Pause</button>}
        <button className="btn btn-soft" style={{ flex: 1 }} onClick={onSkip}><i className="ti ti-player-skip-forward" aria-hidden="true" />Skip</button>
        <button className="btn btn-ghost" onClick={onEnd} aria-label="End workout"><i className="ti ti-x" aria-hidden="true" /></button>
      </div>
    </main>
  );
}
