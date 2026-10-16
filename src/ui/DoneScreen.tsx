import { useMemo, useState } from 'react';
import type { Category, Workout } from '../domain/types';
import { loadStore } from '../storage/store';
import { WeekView } from './WeekView';
import { catColor } from './categoryColor';
import { Icon } from './Icon';
import { localDate } from '../domain/date';

// A fixed confetti burst (no RNG — keeps things deterministic & calm). Its colours
// come from index.css (--confetti-*): the "done" greens plus near-black, no rainbow.
const CONFETTI = [
  { left: '8%', delay: '0ms' }, { left: '18%', delay: '120ms' }, { left: '28%', delay: '40ms' },
  { left: '38%', delay: '200ms' }, { left: '47%', delay: '90ms' }, { left: '56%', delay: '260ms' },
  { left: '64%', delay: '60ms' }, { left: '72%', delay: '180ms' }, { left: '80%', delay: '30ms' },
  { left: '88%', delay: '150ms' }, { left: '13%', delay: '300ms' }, { left: '92%', delay: '230ms' },
];

interface Props { categories: Category[]; streak: number; workout: Workout | null; onHome: () => void }

export function DoneScreen({ categories, streak, workout, onHome }: Props) {
  const practiced = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    for (const c of categories) {
      if (c === 'warmup' || seen.has(c)) continue;
      seen.add(c);
      out.push({ key: c, label: catColor(c).label });
    }
    return out;
  }, [categories]);
  const mins = workout ? Math.round(workout.segments.reduce((a, s) => a + s.durationSec, 0) / 60) : 0;
  const dates = useMemo(() => loadStore().completions.map((c) => c.date), []);
  const [today] = useState(() => localDate(new Date())); // read the clock once, not on every render
  return (
    <main className="screen">
      <div style={{ position: 'relative', textAlign: 'center', padding: '10px 0 16px' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {CONFETTI.map((p, i) => (
            <span key={i} className="confetti" style={{ left: p.left, animationDelay: p.delay }} />
          ))}
        </div>
        <div style={{ width: 66, height: 66, margin: '0 auto 13px', borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-done)', animation: 'pop-check .6s cubic-bezier(.34,1.56,.64,1) both' }}><Icon name="check" size={36} /></div>
        <h1 className="t-hero" style={{ fontSize: 29 }}>Great job, Elli <span aria-hidden="true">🎉</span></h1>
        <div className="muted" style={{ fontSize: 17, marginTop: 5 }}>You're more capable than yesterday.</div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <span className="row muted" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}><Icon name="clock" />{mins} minutes</span>
          <span className="row muted" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}><Icon name="list-check" />{practiced.length} moves</span>
          {streak > 0 && <span className="pill" style={{ padding: '6px 11px' }}><Icon name="flame" style={{ color: 'var(--warm)' }} />{streak}-day streak</span>}
        </div>
        <div className="hint" style={{ fontSize: 'var(--fs-sm)', marginBottom: 9 }}>You practiced</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {practiced.map((p) => <span key={p.key} className="pill" style={{ fontSize: 'var(--fs-sm)', padding: '7px 13px' }}><Icon name="check" size={16} style={{ color: 'var(--brand)' }} />{p.label}</span>)}
        </div>
      </div>

      <WeekView dates={dates} today={today} />

      <button className="btn btn-primary" onClick={onHome} style={{ width: '100%' }}><Icon name="home" />Done</button>
    </main>
  );
}
