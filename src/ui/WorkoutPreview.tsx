import type { Workout } from '../domain/types';
import { circuitMoves } from './format';
import { catColor } from './categoryColor';
import { catVars } from './catVars';

const isTime = (t: string) => /second|minute/.test(t);

interface Props { workout: Workout; detailed: boolean; onOpenMove: (prepareIndex: number) => void }

export function WorkoutPreview({ workout, detailed, onOpenMove }: Props) {
  const moves = circuitMoves(workout);
  const stations = workout.style === 'stations';
  return (
    <div>
      {moves.map((m, i) => {
        const prepIdx = Math.max(0, m.firstSegment - 1);
        const c = catColor(m.category);
        return (
          <button
            key={m.firstSegment}
            onClick={() => onOpenMove(prepIdx)}
            className="move-row"
            style={{ ...catVars(c), animationDelay: `${i * 55}ms`, animation: 'pop-in .45s cubic-bezier(.21,1.02,.45,1) both' }}
            aria-label={`${m.exercise.name}, ${m.target}. Tap to swap this move`}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="t-move">{m.exercise.name}</span>
              {detailed && (
                <span className="row" style={{ gap: 7, marginTop: 6 }}>
                  <span className="cat">{c.label}</span>
                  <span className="row muted" style={{ gap: 4, fontSize: 'var(--fs-sm)' }}>
                    <i className={`ti ${isTime(m.target) ? 'ti-clock' : 'ti-repeat'}`} aria-hidden="true" style={{ fontSize: 16 }} />{m.target}
                  </span>
                  {stations && (
                    <span className="cat" style={{ borderRadius: 'var(--r-pill)' }}>×{workout.rounds} sets</span>
                  )}
                </span>
              )}
            </span>
            {/* explicit "tap to swap" affordance — says what it does, not "go somewhere" */}
            <span className="swap-pill" aria-hidden="true">
              <i className="ti ti-arrows-exchange" style={{ fontSize: 15 }} />Swap
            </span>
          </button>
        );
      })}
    </div>
  );
}
