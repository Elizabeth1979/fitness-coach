import { useId, useState } from 'react';
import type { SessionState } from '../engine/session';
import type { Workout } from '../domain/types';
import { TimerRing } from './TimerRing';
import { previousMoveStart, sessionMoves, currentMoveIndex, circuitMoves, roundInfo, stationInfo, timeLeft, formatClock } from './format';
import { catColor } from './categoryColor';
import { phrases } from '../coach/phrases';
import { Icon } from './Icon';
import { useTapGuard } from './useTapGuard';
import { IdeasSheet } from './IdeasSheet';

interface Props {
  state: SessionState; workout: Workout;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
  /** Back to the start of the move before (hidden when there's none). */
  onBack?: () => void;
  musicOn?: boolean; onToggleMusic?: () => void; musicAvailable?: boolean;
}

export function ActiveScreen({ state, workout, onPause, onResume, onSkip, onBack, onEnd, musicOn, onToggleMusic, musicAvailable }: Props) {
  const listLabel = useId();
  const guard = useTapGuard();
  const [noting, setNoting] = useState(false);
  // Jotting an idea pauses the workout, so the clock doesn't run on while you type.
  function noteIdea() {
    if (state.status === 'running') onPause();
    setNoting(true);
  }
  const seg = state.segment;
  const isIntro = seg?.kind === 'intro'; // the overview before the clock starts
  const isRoundRest = seg?.kind === 'roundrest';
  const isPrepare = seg?.kind === 'prepare'; // the one screen between moves: "Next up", then three-two-one
  const isRest = seg?.kind === 'rest' || isRoundRest; // a break
  const isCalm = isRest || isPrepare; // both get the calm background
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

  const title = isIntro ? "Today's workout"
    : isRoundRest ? `Round ${ri.round} complete`
    : seg?.kind === 'rest' ? 'Rest'
    : isSwitch ? 'Switch sides'
    : isCelebrate ? 'Well done!'
    : (seg?.exercise?.name ?? 'Get ready');

  const phaseLabel = isCelebrate || isIntro ? ''
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
  const subtitle = isIntro ? undefined
    : isSwitch ? `${seg?.exercise?.name ?? ''} · right side next`
    : seg?.side && move ? `${move.target} · ${seg.side} side`
    : move?.target;

  return (
    <main className="screen screen-active" data-tone={isCalm ? 'rest' : undefined} onClickCapture={guard}>
      <p className="sr-only" aria-live="assertive">{isRoundRest ? `Round ${ri.round} of ${ri.totalRounds} complete. Rest.` : isPrepare ? `Rest. Next up: ${title}` : `Now: ${title}`}</p>

      <div className="row active-top">
        <div className="progress"><div className="progress-fill" style={{ transform: `scaleX(${moves.length > 0 && !isIntro ? (mi + 1) / moves.length : 0})` }} /></div>
        {phaseLabel && <div className="muted active-phase">{phaseLabel}</div>}
        <div className="muted active-clock"><Icon name="clock" size={16} />{formatClock(timeLeft(workout, state.segmentIndex, state.segmentRemainingSec))} left</div>
        {musicAvailable && onToggleMusic && (
          <button onClick={onToggleMusic} aria-label={musicOn ? 'Mute background beats' : 'Play background beats'} aria-pressed={musicOn} className="icon-toggle">
            <Icon name={musicOn ? 'music' : 'music-off'} size={18} />
          </button>
        )}
        <button onClick={noteIdea} aria-label="Note an idea" className="icon-toggle">
          <Icon name="bulb" size={18} />
        </button>
      </div>

      <div className="active-chips">
        {showRoundChip && <span className="pill">{chipLabel}</span>}
        {!isRest && !isCelebrate && seg?.exercise && <span className="pill">{cc.label}</span>}
      </div>
      {isPrepare && <div className="eyebrow active-eyebrow">Rest · Next up</div>}
      <div className="t-display active-title">{title}</div>
      {!isRest && !isCelebrate && subtitle && (
        <div className="muted active-subtitle">{subtitle}</div>
      )}

      <div className="active-timer">
        <TimerRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} tone={isCalm || isSwitch || isIntro ? 'rest' : 'work'} label={isIntro ? 'starting in' : undefined} />
      </div>

      {!isRest && !isCelebrate && seg?.exercise && (
        <div className="cue active-cue">{phrases.form(seg.exercise)}</div>
      )}

      {isIntro && (
        <div className="card intro-card">
          <div className="eyebrow" id={listLabel}>{workout.rounds} {stations ? 'sets each' : 'rounds'} of</div>
          <ol className="intro-list" aria-labelledby={listLabel}>
            {circuitMoves(workout).map((m) => <li key={m.exercise.id} className="pill">{m.exercise.name}</li>)}
          </ol>
        </div>
      )}

      {!isCelebrate && !isSwitch && !isPrepare && (() => {
        // On the left side of a one-sided move, what comes next is its right side.
        const rightSideNext = seg?.kind === 'work' && seg.side === 'left' && move;
        // During the intro, what's next is the very first move.
        const up = isIntro && move ? { name: move.exercise.name, label: catColor(move.category).label, target: move.target }
          : rightSideNext
          ? { name: 'Right side', label: cc.label, target: move.target }
          : next && { name: next.exercise.name, label: catColor(next.category).label, target: next.target };
        if (!up) return null;
        return (
          <div className="card row next-card">
            <span className="icon-badge"><Icon name="player-track-next" /></span>
            <div className="row-main">
              <div className="eyebrow next-eyebrow">{isIntro ? 'First up' : 'Next up'}</div>
              <div className="t-panel">{up.name}</div>
            </div>
            <div className="muted next-meta"><span className="next-meta-label">{up.label}</span><br />{up.target}</div>
          </div>
        );
      })()}

      <div className="active-controls">
        {onBack && (
          <button className="btn btn-soft" onClick={onBack} disabled={previousMoveStart(workout, state.segmentIndex) === undefined}>
            <Icon name="player-skip-back" />Back
          </button>
        )}
        {state.status === 'paused'
          ? <button className="btn btn-primary active-main" onClick={onResume}><Icon name="player-play" />Resume</button>
          : <button className="btn btn-dark active-main" onClick={onPause}><Icon name="player-pause" />Pause</button>}
        <button className="btn btn-soft" onClick={onSkip}><Icon name="player-skip-forward" />Skip</button>
        <button className="btn btn-ghost" onClick={onEnd} aria-label="End workout"><Icon name="x" />End</button>
      </div>
      {noting && <IdeasSheet onClose={() => setNoting(false)} />}
    </main>
  );
}
