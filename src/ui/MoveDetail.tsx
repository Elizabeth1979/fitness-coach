import type { Workout } from '../domain/types';
import { formatTarget } from './format';
import { catColor } from './categoryColor';
import { phrases } from '../coach/phrases';
import { Icon } from './Icon';

interface Props { workout: Workout; prepareIndex: number; onSwap: () => void; onClose: () => void }

export function MoveDetail({ workout, prepareIndex, onSwap, onClose }: Props) {
  const prep = workout.segments[prepareIndex];
  const ex = prep?.exercise;
  const work = workout.segments[prepareIndex + 1];
  if (!ex) return null;
  const target = work ? formatTarget(work) : '';
  const c = catColor(ex.category);
  return (
    <div onClick={onClose} className="sheet-backdrop">
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={ex.name} className="sheet">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <span className="eyebrow">{c.label}</span>
          <button className="btn btn-soft" onClick={onClose} aria-label="Close" style={{ padding: 9, minHeight: 44, borderRadius: 12 }}><Icon name="x" size={20} /></button>
        </div>
        <div className="t-title" style={{ marginBottom: 6 }}>{ex.name}</div>
        <div className="row muted" style={{ gap: 6, fontSize: 16, marginBottom: 14 }}>
          <Icon name={ex.measure === 'reps' ? 'repeat' : 'clock'} />{target}
        </div>
        <div className="cue" style={{ marginBottom: 18 }}>{phrases.form(ex)}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-soft" onClick={onSwap} style={{ flex: 1 }}><Icon name="arrows-exchange" />Swap this move</button>
          <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>Keep it</button>
        </div>
      </div>
    </div>
  );
}
