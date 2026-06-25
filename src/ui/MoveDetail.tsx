import type { Workout } from '../domain/types';
import { formatTarget } from './format';

const CAT: Record<string, string> = { push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility' };

interface Props { workout: Workout; prepareIndex: number; onSwap: () => void; onClose: () => void }

export function MoveDetail({ workout, prepareIndex, onSwap, onClose }: Props) {
  const prep = workout.segments[prepareIndex];
  const ex = prep?.exercise;
  const work = workout.segments[prepareIndex + 1];
  if (!ex) return null;
  const target = work ? formatTarget(work) : '';
  return (
    <div onClick={onClose} style={{ minHeight: '100vh', position: 'absolute', inset: 0, background: 'rgba(31,20,48,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={ex.name}
        style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: '20px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="cat">{CAT[ex.category] ?? ex.category}</span>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close" style={{ padding: 9, borderRadius: 12 }}><i className="ti ti-x" aria-hidden="true" /></button>
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>{ex.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
          <i className={`ti ${ex.measure === 'reps' ? 'ti-repeat' : 'ti-clock'}`} aria-hidden="true" />{target}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)', background: 'var(--accent-soft)', borderRadius: 14, padding: 14, marginBottom: 18 }}>{ex.cue}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-soft" onClick={onSwap} style={{ flex: 1 }}><i className="ti ti-arrows-exchange" aria-hidden="true" />Swap this move</button>
          <button className="btn btn-primary" onClick={onClose} style={{ flex: 1 }}>Keep it</button>
        </div>
      </div>
    </div>
  );
}
