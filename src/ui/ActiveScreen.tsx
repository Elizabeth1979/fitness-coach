import type { SessionState } from '../engine/session';
import type { Workout } from '../domain/types';
import { TimerRing } from './TimerRing';
import { sessionMoves, currentMoveIndex, roundInfo, stationInfo } from './format';
import { catColor } from './categoryColor';
import { phrases } from '../coach/phrases';
import { Icon } from './Icon';

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
  const isSwitch = seg?.kind === 'switch'; // between the two sides of a one-sided move
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
    : isSwitch ? 'Switch sides'
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
  const subtitle = isSwitch ? `${seg?.exercise?.name ?? ''} · right side next`
    : seg?.side && move ? `${move.target} · ${seg.side} side`
    : move?.target;

  return (
    <main className="screen screen-active" data-tone={isRest ? 'rest' : undefined}>
      <p className="sr-only" aria-live="assertive">{isRoundRest ? `Round ${ri.round} of ${ri.totalRounds} complete. Rest.` : `Now: ${title}`}</p>

      <div className="row active-top">
        <div className="progress"><div className="progress-fill" style={{ transform: `scaleX(${moves.length > 0 ? (mi + 1) / moves.length : 0})` }} /></div>
        {phaseLabel && <div className="muted active-phase">{phaseLabel}</div>}
        {musicAvailable && onToggleMusic && (
          <button onClick={onToggleMusic} aria-label={musicOn ? 'Mute background beats' : 'Play background beats'} aria-pressed={musicOn} className="icon-toggle">
            <Icon name={musicOn ? 'music' : 'music-off'} size={18} />
          </button>
        )}
      </div>

      <div className="active-chips">
        {showRoundChip && <span className="pill">{chipLabel}</span>}
        {!isRest && !isCelebrate && seg?.exercise && <span className="pill">{cc.label}</span>}
      </div>
      <div className="t-display active-title">{title}</div>
      {!isRest && !isCelebrate && subtitle && (
        <div className="muted active-subtitle">{subtitle}</div>
      )}

      <div className="active-timer">
        <TimerRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} tone={isRest || isSwitch ? 'rest' : 'work'} />
      </div>

      {!isRest && !isCelebrate && seg?.exercise && (
        <div className="cue active-cue">{phrases.form(seg.exercise)}</div>
      )}

      {!isCelebrate && !isSwitch && (() => {
        // On the left side of a one-sided move, what comes next is its right side.
        const rightSideNext = seg?.kind === 'work' && seg.side === 'left' && move;
        const up = rightSideNext
          ? { name: 'Right side', label: cc.label, target: move.target }
          : next && { name: next.exercise.name, label: catColor(next.category).label, target: next.target };
        if (!up) return null;
        return (
          <div className="card row next-card">
            <span className="icon-badge"><Icon name="player-track-next" /></span>
            <div className="row-main">
              <div className="eyebrow next-eyebrow">Next up</div>
              <div className="t-panel">{up.name}</div>
            </div>
            <div className="muted next-meta"><span className="next-meta-label">{up.label}</span><br />{up.target}</div>
          </div>
        );
      })()}

      <div className="active-controls">
        {state.status === 'paused'
          ? <button className="btn btn-primary" onClick={onResume}><Icon name="player-play" />Resume</button>
          : <button className="btn btn-dark" onClick={onPause}><Icon name="player-pause" />Pause</button>}
        <button className="btn btn-soft" onClick={onSkip}><Icon name="player-skip-forward" />Skip</button>
        <button className="btn btn-ghost active-end" onClick={onEnd} aria-label="End workout"><Icon name="x" size={20} /></button>
      </div>
    </main>
  );
}
