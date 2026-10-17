import { useMemo, useState } from 'react';
import type { Category, Workout } from '../domain/types';
import { loadStore } from '../storage/store';
import { WeekView } from './WeekView';
import { catColor } from './categoryColor';
import { Icon } from './Icon';
import { useTapGuard } from './useTapGuard';
import { localDate } from '../domain/date';
import { trainingSec } from '../domain/workout';

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
  const mins = workout ? Math.round(trainingSec(workout) / 60) : 0;
  const dates = useMemo(() => loadStore().completions.map((c) => c.date), []);
  const [today] = useState(() => localDate(new Date())); // read the clock once, not on every render
  const guard = useTapGuard();
  return (
    <main className="screen" onClickCapture={guard}>
      <div className="done-hero">
        <div aria-hidden="true" className="confetti-layer">
          {CONFETTI.map((p, i) => (
            <span key={i} className="confetti" style={{ left: p.left, animationDelay: p.delay }} />
          ))}
        </div>
        <div className="done-check"><Icon name="check" size={36} /></div>
        <h1 className="t-hero done-title">Great job, Elli <span aria-hidden="true">🎉</span></h1>
        <div className="muted done-subtitle">You're more capable than yesterday.</div>
      </div>

      <div className="card done-summary">
        <div className="row-between done-stats">
          <span className="row muted done-stat"><Icon name="clock" />{mins} minutes</span>
          <span className="row muted done-stat"><Icon name="list-check" />{practiced.length} moves</span>
          {streak > 0 && <span className="pill done-streak"><Icon name="flame" className="icon-warm" />{streak}-day streak</span>}
        </div>
        <div className="hint done-practiced-label">You practiced</div>
        <div className="done-practiced">
          {practiced.map((p) => <span key={p.key} className="pill done-chip"><Icon name="check" size={16} className="icon-brand" />{p.label}</span>)}
        </div>
      </div>

      <WeekView dates={dates} today={today} />

      <button className="btn btn-primary btn-block" onClick={onHome}><Icon name="home" />Done</button>
    </main>
  );
}
