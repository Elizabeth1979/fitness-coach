import type { Workout } from '../domain/types';
import { circuitMoves } from './format';
import { catColor } from './categoryColor';

const isTime = (t: string) => /second|minute/.test(t);

interface Props { workout: Workout; detailed: boolean; onOpenMove: (prepareIndex: number) => void }

export function WorkoutPreview({ workout, detailed, onOpenMove }: Props) {
  const moves = circuitMoves(workout);
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
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px 11px 4px', width: '100%', background: 'none', border: 0, borderTop: i === 0 ? 0 : '1px solid #f1ebf7', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'var(--text)', animation: 'pop-in .45s cubic-bezier(.21,1.02,.45,1) both', animationDelay: `${i * 55}ms` }}
            aria-label={`${m.exercise.name}, ${m.target}`}
          >
            <span aria-hidden="true" style={{ flexShrink: 0, width: 12, height: 12, borderRadius: '50%', background: c.ink, boxShadow: `0 0 0 4px ${c.soft}` }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{m.exercise.name}</span>
              {detailed && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                  <span className="cat" style={{ color: c.ink, background: c.soft }}>{c.label}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                    <i className={`ti ${isTime(m.target) ? 'ti-clock' : 'ti-repeat'}`} aria-hidden="true" style={{ fontSize: 15 }} />{m.target}
                  </span>
                </span>
              )}
            </span>
            <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 19, color: c.ink, opacity: .55 }} />
          </button>
        );
      })}
    </div>
  );
}
