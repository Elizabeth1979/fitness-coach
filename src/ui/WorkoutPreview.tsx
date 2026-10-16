import type { Workout } from '../domain/types';
import { circuitMoves } from './format';
import { catColor } from './categoryColor';

interface Props { workout: Workout; onOpenMove: (prepareIndex: number) => void }

// Plain numbered list: name on top, "Push · 8 reps" underneath in grey.
// No per-move colour — colour is reserved for "do this" (the Start button).
export function WorkoutPreview({ workout, onOpenMove }: Props) {
  const moves = circuitMoves(workout);
  const stations = workout.style === 'stations';
  return (
    <div>
      {moves.map((m, i) => (
        <button
          key={m.firstSegment}
          onClick={() => onOpenMove(Math.max(0, m.firstSegment - 1))}
          className="move-row"
          aria-label={`${m.exercise.name}, ${m.target}. Tap to swap this move`}
        >
          <span className="num" aria-hidden="true">{i + 1}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t-move" style={{ display: 'block' }}>{m.exercise.name}</span>
            <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
              {catColor(m.category).label} · {m.target}{stations ? ` · ${workout.rounds} sets` : ''}
            </span>
          </span>
          <span className="swap-pill" aria-hidden="true"><i className="ti ti-arrows-exchange" />Swap</span>
        </button>
      ))}
    </div>
  );
}
