import type { Workout } from '../domain/types';
import { formatTarget } from './format';
import { catColor } from './categoryColor';
import { phrases } from '../coach/phrases';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

interface Props { workout: Workout; prepareIndex: number; canSwap?: boolean; onSwap: () => void; onClose: () => void }

export function MoveDetail({ workout, prepareIndex, canSwap = true, onSwap, onClose }: Props) {
  const prep = workout.segments[prepareIndex];
  const ex = prep?.exercise;
  const work = workout.segments[prepareIndex + 1];
  if (!ex) return null;
  const target = work ? formatTarget(work) : '';
  const c = catColor(ex.category);
  return (
    <Sheet label={ex.name} onClose={onClose}>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="eyebrow">{c.label}</span>
        <button className="btn btn-soft" onClick={onClose} aria-label="Close" style={{ padding: 9, minHeight: 44, borderRadius: 12 }}><Icon name="x" size={20} /></button>
      </div>
      <div className="t-title" style={{ marginBottom: 6 }}>{ex.name}</div>
      <div className="row muted" style={{ gap: 6, fontSize: 16, marginBottom: 14 }}>
        <Icon name={ex.measure === 'reps' ? 'repeat' : 'clock'} />{target}
      </div>
      <div className="cue" style={{ marginBottom: 18 }}>{phrases.form(ex)}</div>
      {canSwap ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-soft" onClick={onSwap} style={{ flex: 1 }}><Icon name="arrows-exchange" />Swap this move</button>
          <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>Keep it</button>
        </div>
      ) : (
        <>
          <div className="hint" style={{ fontSize: 'var(--fs-sm)', marginBottom: 12 }}>No other move like this fits today, so this one stays.</div>
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Got it</button>
        </>
      )}
    </Sheet>
  );
}
