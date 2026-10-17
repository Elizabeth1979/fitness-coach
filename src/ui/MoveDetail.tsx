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
      <div className="row-between detail-head">
        <span className="eyebrow">{c.label}</span>
        <button className="btn btn-soft btn-close" onClick={onClose} aria-label="Close"><Icon name="x" size={20} /></button>
      </div>
      <div className="t-title detail-title">{ex.name}</div>
      <div className="row muted detail-target">
        <Icon name={ex.measure === 'reps' ? 'repeat' : 'clock'} />{target}
      </div>
      <div className="cue detail-cue">{phrases.form(ex)}</div>
      {canSwap ? (
        <div className="detail-actions">
          <button className="btn btn-soft" onClick={onSwap}><Icon name="arrows-exchange" />Swap this move</button>
          <button className="btn btn-primary" onClick={onClose}>Keep it</button>
        </div>
      ) : (
        <>
          <div className="hint detail-note">No other move like this fits today, so this one stays.</div>
          <button className="btn btn-primary btn-block" onClick={onClose}>Got it</button>
        </>
      )}
    </Sheet>
  );
}
