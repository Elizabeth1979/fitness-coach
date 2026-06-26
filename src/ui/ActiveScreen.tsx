import type { SessionState } from '../engine/session';
import type { Workout } from '../domain/types';
import { TimerRing } from './TimerRing';
import { sessionMoves, currentMoveIndex, roundInfo } from './format';
import { catColor } from './categoryColor';

interface Props {
  state: SessionState; workout: Workout;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
}

export function ActiveScreen({ state, workout, onPause, onResume, onSkip, onEnd }: Props) {
  const seg = state.segment;
  const isRoundRest = seg?.kind === 'roundrest';
  const isRest = seg?.kind === 'rest' || isRoundRest; // both get the calm background
  const isPrepare = seg?.kind === 'prepare';
  const isCelebrate = seg?.kind === 'celebrate';
  const moves = sessionMoves(workout);
  const mi = currentMoveIndex(moves, isPrepare ? state.segmentIndex + 1 : state.segmentIndex);
  const move = moves[mi];
  const next = moves[mi + 1];
  const ri = roundInfo(workout, state.segmentIndex);

  const title = isRoundRest ? `Round ${ri.round} complete`
    : seg?.kind === 'rest' ? 'Rest'
    : isCelebrate ? 'Well done!'
    : (seg?.exercise?.name ?? 'Get ready');

  const phaseLabel = isCelebrate ? ''
    : isRoundRest ? `Round ${ri.round} of ${ri.totalRounds}`
    : ri.round > 0 ? `Move ${ri.moveInRound} of ${ri.movesPerRound}`
    : 'Warm-up';

  const showRoundChip = ri.round > 0 && !isRoundRest && !isCelebrate;
  const cc = seg?.exercise ? catColor(seg.exercise.category) : catColor('warmup');
  const ringColor = isRest ? '#3b82c4' : isCelebrate ? '#1aa772' : cc.ink;

  return (
    <main className="screen" style={{ display: 'flex', flexDirection: 'column', background: isRest ? '#eef3fb' : 'var(--bg)' }}>
      <p className="sr-only" aria-live="assertive">{isRoundRest ? `Round ${ri.round} of ${ri.totalRounds} complete. Rest.` : `Now: ${title}`}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ flex: 1, height: 8, background: '#ece2f7', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${moves.length > 0 ? Math.round(((mi + 1) / moves.length) * 100) : 0}%`, height: '100%', background: cc.ink, borderRadius: 99, transition: 'width .4s cubic-bezier(.21,1.02,.45,1), background .3s' }} />
        </div>
        {phaseLabel && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{phaseLabel}</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, marginBottom: 7, minHeight: 24 }}>
        {showRoundChip && <span className="pill">Round {ri.round} of {ri.totalRounds}</span>}
        {!isRest && !isCelebrate && seg?.exercise && <span className="pill" style={{ color: cc.ink, background: cc.soft }}>{cc.label}</span>}
      </div>
      <div style={{ textAlign: 'center', fontSize: 34, fontWeight: 700, letterSpacing: '-.3px', marginBottom: 7 }}>{title}</div>
      {!isRest && !isCelebrate && move && (
        <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>{move.target}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 18px' }}>
        <TimerRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} color={ringColor} />
      </div>

      {next && !isCelebrate && (() => {
        const nc = catColor(next.category);
        return (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', marginBottom: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '50%', background: nc.soft, color: nc.ink }}><i className="ti ti-arrow-right" aria-hidden="true" /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>Next up</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{next.exercise.name}</div>
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'right' }}><span style={{ color: nc.ink, fontWeight: 700 }}>{nc.label}</span><br />{next.target}</div>
          </div>
        );
      })()}

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
