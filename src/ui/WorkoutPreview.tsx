import type { Workout } from '../domain/types';
import { sessionMoves } from './format';

const CAT: Record<string, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl',
  core: 'Core', balance: 'Balance', mobility: 'Mobility',
};
const isTime = (t: string) => /second|minute/.test(t);

interface Props { workout: Workout; detailed: boolean; onOpenMove: (prepareIndex: number) => void }

export function WorkoutPreview({ workout, detailed, onOpenMove }: Props) {
  const moves = sessionMoves(workout).filter((m) => !m.isWarmup);
  return (
    <div>
      {moves.map((m) => {
        const prepIdx = Math.max(0, m.firstSegment - 1);
        return (
          <button
            key={m.firstSegment}
            onClick={() => onOpenMove(prepIdx)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 2px', width: '100%', background: 'none', border: 0, borderTop: '1px solid #f1ebf7', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'var(--text)' }}
            aria-label={`${m.exercise.name}, ${m.target}`}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{m.exercise.name}</span>
              {detailed && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                  <span className="cat">{CAT[m.category] ?? m.category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                    <i className={`ti ${isTime(m.target) ? 'ti-clock' : 'ti-repeat'}`} aria-hidden="true" style={{ fontSize: 15 }} />{m.target}
                  </span>
                </span>
              )}
            </span>
            <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 19, color: '#c9bdda' }} />
          </button>
        );
      })}
    </div>
  );
}
