import type { SessionState } from '../engine/session';
import type { Workout } from '../domain/types';
import { TimerRing } from './TimerRing';
import { sessionMoves, currentMoveIndex, roundInfo, stationInfo } from './format';
import { catColor } from './categoryColor';
import { phrases } from '../coach/phrases';

interface Props {
  state: SessionState; workout: Workout;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
  musicOn?: boolean; onToggleMusic?: () => void; musicAvailable?: boolean;
}

export function ActiveScreen({ state, workout, onPause, onResume, onSkip, onEnd, musicOn, onToggleMusic, musicAvailable }: Props) {
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
  const stations = workout.style === 'stations';
  const si = stations ? stationInfo(workout, state.segmentIndex) : null;
  const isCore = seg?.block === 'core';

  const title = isRoundRest ? `Round ${ri.round} complete`
    : seg?.kind === 'rest' ? 'Rest'
    : isCelebrate ? 'Well done!'
    : (seg?.exercise?.name ?? 'Get ready');

  const phaseLabel = isCelebrate ? ''
    : isCore ? 'Core finisher'
    : stations ? (si!.station > 0 ? `Set ${si!.set} of ${si!.totalSets}` : 'Warm-up')
    : isRoundRest ? `Round ${ri.round} of ${ri.totalRounds}`
    : ri.round > 0 ? `Move ${ri.moveInRound} of ${ri.movesPerRound}`
    : 'Warm-up';

  // The chip above the title: "Station x of N" in stations mode, "Round x of N" in circuit.
  const chipLabel = stations
    ? (si!.station > 0 ? `Station ${si!.station} of ${si!.totalStations}` : '')
    : (ri.round > 0 ? `Round ${ri.round} of ${ri.totalRounds}` : '');
  const showRoundChip = !!chipLabel && !isRoundRest && !isCelebrate;
  const cc = seg?.exercise ? catColor(seg.exercise.category) : catColor('warmup');
  // Green = the clock you're working against. Rest is calm grey.
  const ringColor = isRest ? '#8a909c' : '#15803d';

  return (
    <main className="screen" style={{ display: 'flex', flexDirection: 'column', background: isRest ? '#e9f0fb' : 'var(--bg)' }}>
      <p className="sr-only" aria-live="assertive">{isRoundRest ? `Round ${ri.round} of ${ri.totalRounds} complete. Rest.` : `Now: ${title}`}</p>

      <div className="row" style={{ marginBottom: 22 }}>
        <div className="progress"><div className="progress-fill" style={{ transform: `scaleX(${moves.length > 0 ? (mi + 1) / moves.length : 0})` }} /></div>
        {phaseLabel && <div className="muted" style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, whiteSpace: 'nowrap' }}>{phaseLabel}</div>}
        {musicAvailable && onToggleMusic && (
          <button onClick={onToggleMusic} aria-label={musicOn ? 'Mute background beats' : 'Play background beats'} aria-pressed={musicOn} className="icon-toggle">
            <i className={`ti ${musicOn ? 'ti-music' : 'ti-music-off'}`} aria-hidden="true" style={{ fontSize: 18 }} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, marginBottom: 7, minHeight: 24 }}>
        {showRoundChip && <span className="pill">{chipLabel}</span>}
        {!isRest && !isCelebrate && seg?.exercise && <span className="pill">{cc.label}</span>}
      </div>
      <div className="t-display" style={{ textAlign: 'center', marginBottom: 7 }}>{title}</div>
      {!isRest && !isCelebrate && move && (
        <div className="muted" style={{ textAlign: 'center', fontSize: 17, marginBottom: 16 }}>{move.target}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 18px' }}>
        <TimerRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} color={ringColor} />
      </div>

      {!isRest && !isCelebrate && seg?.exercise && (
        <div className="cue" style={{ marginBottom: 14 }}>{phrases.form(seg.exercise)}</div>
      )}

      {next && !isCelebrate && (() => {
        const nc = catColor(next.category);
        return (
          <div className="card row" style={{ gap: 11, padding: '11px 13px', marginBottom: 18 }}>
            <span className="icon-badge"><i className="ti ti-player-track-next" aria-hidden="true" /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow" style={{ fontSize: 'var(--fs-2xs)' }}>Next up</div>
              <div className="t-panel">{next.exercise.name}</div>
            </div>
            <div className="muted" style={{ fontSize: 'var(--fs-xs)', textAlign: 'right' }}><span style={{ color: 'var(--text)', fontWeight: 800 }}>{nc.label}</span><br />{next.target}</div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', gap: 9, marginTop: 'auto' }}>
        {state.status === 'paused'
          ? <button className="btn btn-primary" style={{ flex: 1 }} onClick={onResume}><i className="ti ti-player-play" aria-hidden="true" />Resume</button>
          : <button className="btn btn-dark" style={{ flex: 1 }} onClick={onPause}><i className="ti ti-player-pause" aria-hidden="true" />Pause</button>}
        <button className="btn btn-soft" style={{ flex: 1 }} onClick={onSkip}><i className="ti ti-player-skip-forward" aria-hidden="true" />Skip</button>
        <button className="btn btn-ghost" onClick={onEnd} aria-label="End workout" style={{ minWidth: 56 }}><i className="ti ti-x" aria-hidden="true" style={{ fontSize: 20 }} /></button>
      </div>
    </main>
  );
}
