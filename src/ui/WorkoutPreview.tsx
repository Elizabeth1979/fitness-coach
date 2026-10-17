import type { Workout } from '../domain/types';
import { circuitMoves } from './format';
import { catColor } from './categoryColor';
import { Icon } from './Icon';

interface Props {
  workout: Workout; onOpenMove: (prepareIndex: number) => void;
  /** Whether the move whose prepare step is at this index has anything to swap to. */
  canSwap?: (prepareIndex: number) => boolean;
}

// Plain numbered list: name on top, "Push · 8 reps" underneath in grey.
// No per-move colour — colour is reserved for "do this" (the Start button).
export function WorkoutPreview({ workout, onOpenMove, canSwap = () => true }: Props) {
  const moves = circuitMoves(workout);
  const stations = workout.style === 'stations';
  return (
    <div>
      {moves.map((m, i) => {
        const prepareIndex = Math.max(0, m.firstSegment - 1);
        const swappable = canSwap(prepareIndex);
        return (
          <button
            key={m.firstSegment}
            onClick={() => onOpenMove(prepareIndex)}
            className="move-row"
            aria-label={`${m.exercise.name}, ${m.target}. ${swappable ? 'Tap to swap this move' : 'Tap to see how to do it'}`}
          >
            <span className="num" aria-hidden="true">{i + 1}</span>
            <span className="row-main">
              <span className="t-move move-name">{m.exercise.name}</span>
              <span className="muted move-meta">
                {catColor(m.category).label} · {m.target}{stations ? ` · ${workout.rounds} sets` : ''}
              </span>
            </span>
            {swappable && <span className="swap-pill" aria-hidden="true"><Icon name="arrows-exchange" />Swap</span>}
          </button>
        );
      })}
    </div>
  );
}
