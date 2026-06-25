import { useState } from 'react';
import type { Workout, WorkoutKind } from '../domain/types';
import { focusForDate } from '../generator/schedule';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';
import { WorkoutPreview } from './WorkoutPreview';
import { sessionMoves } from './format';

interface Props {
  workout: Workout; kind: WorkoutKind; onKind: (k: WorkoutKind) => void; streak: number;
  canResume?: boolean; onResume?: () => void; onReroll: () => void; onStart: () => void;
  onOpenMove: (prepareIndex: number) => void;
}
const KINDS: WorkoutKind[] = ['10min', '20min', '30min'];
const total = (w: Workout) => Math.round(w.segments.reduce((s, x) => s + x.durationSec, 0) / 60);

export function HomeScreen(p: Props) {
  const [detailed, setDetailed] = useState(true);
  const voices = useVoices();
  const [voiceURI, setVoiceURI] = useState<string | undefined>(() => getPrefs().voiceURI);
  const focus = focusForDate(new Date());
  const warm = sessionMoves(p.workout).find((m) => m.isWarmup);

  function handleVoiceChange(uri: string) {
    const next = uri || undefined;
    setVoiceURI(next);
    setPrefs({ ...getPrefs(), voiceURI: next });
    if (typeof speechSynthesis !== 'undefined' && next) {
      const u = new SpeechSynthesisUtterance('Hi Elli, ready to move?');
      const v = voices.find((x) => x.voiceURI === next); if (v) u.voice = v; u.rate = 0.96;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }

  return (
    <main className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-hint)' }}>Good morning, Elli</div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-.3px' }}>Move With Elli</div>
        </div>
        {p.streak > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 12, fontWeight: 500, padding: '7px 11px', borderRadius: 99 }}>
            <i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 16 }} />{p.streak}-day streak
          </span>
        )}
      </div>

      {p.canResume && p.onResume && (
        <button className="btn btn-soft" onClick={p.onResume} style={{ width: '100%', marginBottom: 12, background: 'var(--warm-soft)', color: 'var(--warm)' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Resume workout
        </button>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Today · {focus === 'strength' ? 'Strength' : 'Movement'}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="pill"><i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{total(p.workout)} minutes</span>
            <span className="pill"><i className="ti ti-repeat" aria-hidden="true" style={{ fontSize: 14 }} />{p.workout.rounds} rounds</span>
          </div>
        </div>

        <div role="group" aria-label="Detail level" style={{ display: 'flex', gap: 5, background: '#f3edfa', borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {[['Compact', false], ['Detailed', true]].map(([label, val]) => (
            <button key={label as string} onClick={() => setDetailed(val as boolean)} aria-pressed={detailed === val}
              style={{ flex: 1, fontSize: 12, padding: '7px 0', borderRadius: 9, border: 0, cursor: 'pointer', font: 'inherit',
                fontWeight: detailed === val ? 500 : 400, background: detailed === val ? '#fff' : 'transparent', color: detailed === val ? 'var(--accent)' : 'var(--text-muted)' }}>
              {label as string}
            </button>
          ))}
        </div>

        {warm && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#f7eefc', border: '1px solid #efe1f8', borderRadius: 14, padding: '11px 12px', marginBottom: 6 }}>
            <i className="ti ti-music" aria-hidden="true" style={{ fontSize: 20, color: '#7a3ea3' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--accent-ink)' }}>{warm.exercise.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)' }}>Today's warm-up · once at the start</div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7a3ea3' }}>
              <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 15 }} />{warm.target}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '.4px' }}>The circuit</span>
          <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>repeat {p.workout.rounds}×</span>
        </div>
        <WorkoutPreview workout={p.workout} detailed={detailed} onOpenMove={p.onOpenMove} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1ebf7', fontSize: 12, color: 'var(--text-muted)' }}>
          <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 15 }} />About {total(p.workout)} minutes · {p.workout.rounds} rounds · a longer rest between each
        </div>

        <button className="btn btn-soft" onClick={p.onReroll} style={{ width: '100%', marginTop: 12, fontSize: 14, padding: '10px' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Different mix
        </button>
      </div>

      <div role="radiogroup" aria-label="Workout length" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {KINDS.map((k) => (
          <button key={k} role="radio" aria-checked={p.kind === k} onClick={() => p.onKind(k)}
            style={{ flex: 1, fontSize: 13, padding: '11px 0', borderRadius: 13, cursor: 'pointer', font: 'inherit',
              border: p.kind === k ? 0 : '1px solid #e7def2', fontWeight: p.kind === k ? 500 : 400,
              background: p.kind === k ? 'var(--accent)' : '#fff', color: p.kind === k ? '#fff' : 'var(--accent)' }}>
            {k.replace('min', ' minutes')}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={p.onStart} style={{ width: '100%' }} aria-label="Start workout">
        <i className="ti ti-player-play" aria-hidden="true" />Start workout
      </button>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <VoicePicker voices={voices} value={voiceURI} onChange={handleVoiceChange} />
      </div>
    </main>
  );
}
