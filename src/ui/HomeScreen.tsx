import { useState } from 'react';
import type { Workout, WorkoutKind, WorkoutStyle } from '../domain/types';
import { focusForDate } from '../generator/schedule';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';
import { WorkoutPreview } from './WorkoutPreview';
import { warmupMoves } from './format';
import { warmupFlowName } from '../generator/warmupFlows';
import { catColor } from './categoryColor';

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface Props {
  workout: Workout; kind: WorkoutKind; onKind: (k: WorkoutKind) => void; streak: number;
  style?: WorkoutStyle; onStyle?: (s: WorkoutStyle) => void;
  onSwapWarmup?: () => void;
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
  const warmups = warmupMoves(p.workout);
  const warmName = warmupFlowName(p.workout.warmupThemeId);
  const style: WorkoutStyle = p.style ?? 'circuit';
  const rounds = p.workout.rounds;

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
          <div style={{ fontSize: 16, color: 'var(--text-hint)', fontWeight: 600 }}>{greeting(new Date())}, Elli <span aria-hidden="true">👋</span></div>
          <div className="hero-title">Move With Elli</div>
        </div>
        {p.streak > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 14, fontWeight: 700, padding: '8px 12px', borderRadius: 99 }}>
            <i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 17 }} />{p.streak}-day streak
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
          <div style={{ fontSize: 19, fontWeight: 700 }}>Today · {focus === 'strength' ? 'Strength' : 'Movement'}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="pill"><i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{total(p.workout)} minutes</span>
            <span className="pill"><i className="ti ti-repeat" aria-hidden="true" style={{ fontSize: 14 }} />{rounds} {style === 'stations' ? 'sets' : 'rounds'}</span>
          </div>
        </div>

        <div role="group" aria-label="Detail level" style={{ display: 'flex', gap: 5, background: '#f3edfa', borderRadius: 12, padding: 4, marginBottom: 14 }}>
          {[['Compact', false], ['Detailed', true]].map(([label, val]) => (
            <button key={label as string} onClick={() => setDetailed(val as boolean)} aria-pressed={detailed === val}
              style={{ flex: 1, fontSize: 15, padding: '9px 0', borderRadius: 9, border: 0, cursor: 'pointer', font: 'inherit',
                fontWeight: detailed === val ? 700 : 500, background: detailed === val ? '#fff' : 'transparent', color: detailed === val ? 'var(--accent)' : 'var(--text-muted)' }}>
              {label as string}
            </button>
          ))}
        </div>

        {warmups.length > 0 && (() => {
          const wc = catColor('warmup');
          return (
            <div style={{ background: wc.soft, border: `1px solid ${wc.ink}22`, borderRadius: 14, padding: '11px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#fff', color: wc.ink, boxShadow: `0 0 0 3px ${wc.ink}1a`, flexShrink: 0 }}>
                  <i className="ti ti-music" aria-hidden="true" style={{ fontSize: 22 }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: wc.ink }}>Warm-up{warmName ? ` · ${warmName}` : ''}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-hint)' }}>{warmups.length} {warmups.length === 1 ? 'move' : 'moves'} · once at the start</div>
                </div>
              </div>

              {detailed ? (
                <div style={{ marginTop: 9 }}>
                  {warmups.map((m, i) => (
                    <div key={m.firstSegment} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 2px', borderTop: i === 0 ? 0 : `1px solid ${wc.ink}1a` }}>
                      <span aria-hidden="true" style={{ fontSize: 13, fontWeight: 700, color: wc.ink, width: 18, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{m.exercise.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: wc.ink }}>
                        <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{m.target}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                // Compact: the whole flow on one wrapping line, moves linked with arrows.
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.55 }}>
                  {warmups.map((m, i) => (
                    <span key={m.firstSegment}>
                      {i > 0 && <i className="ti ti-arrow-right" aria-hidden="true" style={{ fontSize: 13, color: wc.ink, opacity: .6, margin: '0 5px', verticalAlign: 'middle' }} />}
                      {m.exercise.name}
                    </span>
                  ))}
                </div>
              )}

              {p.onSwapWarmup && (
                <button onClick={p.onSwapWarmup}
                  style={{ width: '100%', marginTop: 9, fontSize: 14, fontWeight: 700, padding: '9px', borderRadius: 11, border: 0, cursor: 'pointer', font: 'inherit', background: '#fff', color: wc.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <i className="ti ti-refresh" aria-hidden="true" />Different warm-up
                </button>
              )}
            </div>
          );
        })()}

        {p.onStyle && (
          <div style={{ marginTop: 14 }}>
            <div role="radiogroup" aria-label="Workout style" style={{ display: 'flex', gap: 5, background: '#f3edfa', borderRadius: 12, padding: 4 }}>
              {([['circuit', 'Circuit'], ['stations', 'Stations']] as const).map(([val, label]) => (
                <button key={val} role="radio" aria-checked={style === val} onClick={() => p.onStyle!(val)}
                  style={{ flex: 1, fontSize: 15, padding: '9px 0', borderRadius: 9, border: 0, cursor: 'pointer', font: 'inherit',
                    fontWeight: style === val ? 700 : 500, background: style === val ? '#fff' : 'transparent', color: style === val ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-hint)', margin: '7px 2px 0' }}>
              {style === 'stations'
                ? `Do all ${rounds} sets of one move (with rest between), then the next.`
                : `Do all moves once, then repeat the whole circuit — ${rounds} rounds.`}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{style === 'stations' ? 'The moves' : 'The circuit'}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-hint)' }}>{style === 'stations' ? `${rounds} sets each` : `repeat ${rounds}×`}</span>
        </div>
        <WorkoutPreview workout={p.workout} detailed={detailed} onOpenMove={p.onOpenMove} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1ebf7', fontSize: 14, color: 'var(--text-muted)' }}>
          <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 16 }} />About {total(p.workout)} minutes · {style === 'stations' ? `${rounds} sets each · rest between sets` : `${rounds} rounds · a longer rest between each`}
        </div>

        <button className="btn btn-soft" onClick={p.onReroll} style={{ width: '100%', marginTop: 12, fontSize: 16, padding: '12px' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Different mix
        </button>
      </div>

      <div role="radiogroup" aria-label="Workout length" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {KINDS.map((k) => (
          <button key={k} role="radio" aria-checked={p.kind === k} onClick={() => p.onKind(k)}
            style={{ flex: 1, fontSize: 17, padding: '13px 0', borderRadius: 14, cursor: 'pointer', font: 'inherit', transition: 'transform .12s',
              border: p.kind === k ? 0 : '1px solid #e7def2', fontWeight: p.kind === k ? 700 : 500,
              background: p.kind === k ? 'var(--accent)' : '#fff', color: p.kind === k ? '#fff' : 'var(--accent)',
              boxShadow: p.kind === k ? '0 6px 16px -5px rgba(115,56,176,.45)' : 'none' }}>
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
