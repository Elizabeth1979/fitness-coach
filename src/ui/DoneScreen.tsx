import { useMemo } from 'react';
import type { Category, Workout } from '../domain/types';
import { loadStore } from '../storage/store';
import { WeekView } from './WeekView';
import { catColor } from './categoryColor';

const today = () => new Date().toISOString().slice(0, 10);

// A fixed, cheerful confetti burst (no RNG — keeps things deterministic & calm).
const CONFETTI = [
  { left: '8%', color: '#e8454f', delay: '0ms' }, { left: '18%', color: '#1c7ed6', delay: '120ms' },
  { left: '28%', color: '#2f9e44', delay: '40ms' }, { left: '38%', color: '#e8830c', delay: '200ms' },
  { left: '47%', color: '#9c36b5', delay: '90ms' }, { left: '56%', color: '#d6336c', delay: '260ms' },
  { left: '64%', color: '#0c8599', delay: '60ms' }, { left: '72%', color: '#7048e8', delay: '180ms' },
  { left: '80%', color: '#fb7185', delay: '30ms' }, { left: '88%', color: '#3b5bdb', delay: '150ms' },
  { left: '13%', color: '#fcc419', delay: '300ms' }, { left: '92%', color: '#2f9e44', delay: '230ms' },
];

interface Props { categories: Category[]; streak: number; workout: Workout | null; onHome: () => void }

export function DoneScreen({ categories, streak, workout, onHome }: Props) {
  const practiced = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; label: string; ink: string; soft: string }[] = [];
    for (const c of categories) {
      if (c === 'warmup' || seen.has(c)) continue;
      seen.add(c);
      const col = catColor(c);
      out.push({ key: c, label: col.label, ink: col.ink, soft: col.soft });
    }
    return out;
  }, [categories]);
  const mins = workout ? Math.round(workout.segments.reduce((a, s) => a + s.durationSec, 0) / 60) : 0;
  const dates = useMemo(() => loadStore().completions.map((c) => c.date), []);
  return (
    <main className="screen">
      <div style={{ position: 'relative', textAlign: 'center', padding: '10px 0 16px' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {CONFETTI.map((p, i) => (
            <span key={i} className="confetti" style={{ left: p.left, background: p.color, animationDelay: p.delay }} />
          ))}
        </div>
        <div style={{ width: 66, height: 66, margin: '0 auto 13px', borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 22px rgba(26,167,114,.32)', animation: 'pop-check .6s cubic-bezier(.34,1.56,.64,1) both' }}><i className="ti ti-check" aria-hidden="true" style={{ fontSize: 36 }} /></div>
        <div style={{ fontSize: 23, fontWeight: 700 }}>Great job, Elli <span aria-hidden="true">🎉</span></div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>You're more capable than yesterday.</div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}><i className="ti ti-clock" aria-hidden="true" />{mins} minutes</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}><i className="ti ti-list-check" aria-hidden="true" />{practiced.length} moves</span>
          {streak > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 99 }}><i className="ti ti-flame" aria-hidden="true" />{streak}-day streak</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 9 }}>You practiced</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {practiced.map((p) => <span key={p.key} className="chip" style={{ color: p.ink, background: p.soft }}><i className="ti ti-check" aria-hidden="true" style={{ fontSize: 15, color: p.ink }} />{p.label}</span>)}
        </div>
      </div>

      <WeekView dates={dates} today={today()} />

      <button className="btn btn-primary" onClick={onHome} style={{ width: '100%' }}><i className="ti ti-home" aria-hidden="true" />Done</button>
    </main>
  );
}
