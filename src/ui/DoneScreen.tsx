import { useMemo } from 'react';
import type { Category, Workout } from '../domain/types';
import { loadStore } from '../storage/store';
import { WeekView } from './WeekView';

const LABELS: Partial<Record<Category, string>> = { push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge', carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility' };
const today = () => new Date().toISOString().slice(0, 10);

interface Props { categories: Category[]; streak: number; workout: Workout | null; onHome: () => void }

export function DoneScreen({ categories, streak, workout, onHome }: Props) {
  const practiced = Array.from(new Set(categories.map((c) => LABELS[c]).filter(Boolean))) as string[];
  const mins = workout ? Math.round(workout.segments.reduce((a, s) => a + s.durationSec, 0) / 60) : 0;
  const dates = useMemo(() => loadStore().completions.map((c) => c.date), []);
  return (
    <main className="screen">
      <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
        <div style={{ width: 66, height: 66, margin: '0 auto 13px', borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="ti ti-check" aria-hidden="true" style={{ fontSize: 36 }} /></div>
        <div style={{ fontSize: 23, fontWeight: 500 }}>Great job, Elli</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>You're more capable than yesterday.</div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}><i className="ti ti-clock" aria-hidden="true" />{mins} minutes</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}><i className="ti ti-list-check" aria-hidden="true" />{practiced.length} moves</span>
          {streak > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 12, fontWeight: 500, padding: '5px 10px', borderRadius: 99 }}><i className="ti ti-flame" aria-hidden="true" />{streak}-day streak</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginBottom: 9 }}>You practiced</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {practiced.map((p) => <span key={p} className="chip"><i className="ti ti-check" aria-hidden="true" style={{ fontSize: 15, color: 'var(--accent)' }} />{p}</span>)}
        </div>
      </div>

      <WeekView dates={dates} today={today()} />

      <button className="btn btn-primary" onClick={onHome} style={{ width: '100%' }}><i className="ti ti-home" aria-hidden="true" />Done</button>
    </main>
  );
}
