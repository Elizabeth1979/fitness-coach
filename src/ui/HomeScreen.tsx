import { useState } from 'react';
import type { SoreArea, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';
import { focusForDate } from '../generator/schedule';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';
import { WorkoutPreview } from './WorkoutPreview';
import { warmupMoves, coreMoves } from './format';
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
  sore?: SoreArea; onSore?: (s: SoreArea) => void; soreSuggested?: SoreArea;
  canResume?: boolean; onResume?: () => void; onReroll: () => void; onStart: () => void;
  onOpenMove: (prepareIndex: number) => void;
}
const KINDS: WorkoutKind[] = ['10min', '20min', '30min'];
const SORES: { id: SoreArea; label: string }[] = [
  { id: 'none', label: 'All good' }, { id: 'shoulders', label: 'Shoulders' },
  { id: 'back', label: 'Back' }, { id: 'legs', label: 'Legs' },
];
const total = (w: Workout) => Math.round(w.segments.reduce((s, x) => s + x.durationSec, 0) / 60);

export function HomeScreen(p: Props) {
  const [detailed, setDetailed] = useState(true);
  const voices = useVoices();
  const [voiceURI, setVoiceURI] = useState<string | undefined>(() => getPrefs().voiceURI);
  const focus = focusForDate(new Date());
  const warmups = warmupMoves(p.workout);
  const warmName = warmupFlowName(p.workout.warmupThemeId);
  const cores = coreMoves(p.workout);
  const coreSec = p.workout.segments.filter((s) => s.block === 'core').reduce((a, s) => a + s.durationSec, 0);
  const style: WorkoutStyle = p.style ?? 'circuit';
  const rounds = p.workout.rounds;
  const sore: SoreArea = p.sore ?? 'none';
  const suggestedLabel = SORES.find((s) => s.id === p.soreSuggested)?.label;

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--text-hint)', fontWeight: 600 }}>{greeting(new Date())}, Elli <span aria-hidden="true">👋</span></div>
          <div className="hero-title">Move With Elli</div>
        </div>
        {p.streak > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warm-soft)', color: 'var(--warm)', fontSize: 14, fontWeight: 600, padding: '8px 12px', borderRadius: 99 }}>
            <i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 17 }} />{p.streak}-day streak
          </span>
        )}
      </div>

      {p.canResume && p.onResume && (
        <button className="btn btn-soft" onClick={p.onResume} style={{ width: '100%', marginBottom: 16, background: 'var(--warm-soft)', color: 'var(--warm)' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Resume workout
        </button>
      )}

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="t-title">Today · {focus === 'strength' ? 'Strength' : 'Movement'}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="pill"><i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{total(p.workout)} minutes</span>
            <span className="pill"><i className="ti ti-repeat" aria-hidden="true" style={{ fontSize: 14 }} />{rounds} {style === 'stations' ? 'sets' : 'rounds'}</span>
          </div>
        </div>

        <div role="group" aria-label="Detail level" style={{ display: 'flex', gap: 5, background: 'var(--control-bg)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {[['Compact', false], ['Detailed', true]].map(([label, val]) => (
            <button key={label as string} onClick={() => setDetailed(val as boolean)} aria-pressed={detailed === val}
              style={{ flex: 1, fontSize: 15, padding: '9px 0', borderRadius: 9, border: 0, cursor: 'pointer', font: 'inherit',
                fontWeight: detailed === val ? 600 : 500, background: detailed === val ? '#fff' : 'transparent', color: detailed === val ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: detailed === val ? '0 0 0 1px var(--border), 0 1px 2px rgba(30,25,40,.05)' : 'none' }}>
              {label as string}
            </button>
          ))}
        </div>

        {warmups.length > 0 && (() => {
          const wc = catColor('warmup');
          return (
            <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="ti ti-stretching" aria-hidden="true" style={{ fontSize: 20, color: wc.ink, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Warm-up{warmName ? ` · ${warmName}` : ''}</div>
                  <div className="t-hint">{warmups.length} {warmups.length === 1 ? 'move' : 'moves'} · once at the start</div>
                </div>
              </div>

              {/* Detailed: the full numbered list. Compact: header only (no move list). */}
              {detailed && (
                <div style={{ marginTop: 8 }}>
                  {warmups.map((m, i) => (
                    <div key={m.firstSegment} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 2px', borderTop: i === 0 ? 0 : '1px solid var(--divider)' }}>
                      <span aria-hidden="true" style={{ fontSize: 13, fontWeight: 600, color: wc.ink, width: 18, flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{m.exercise.name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                        <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{m.target}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {p.onSwapWarmup && (
                <button onClick={p.onSwapWarmup}
                  style={{ width: '100%', marginTop: 4, fontSize: 14, fontWeight: 600, padding: '8px', borderRadius: 10, border: 0, cursor: 'pointer', font: 'inherit', background: 'transparent', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <i className="ti ti-refresh" aria-hidden="true" />Different warm-up
                </button>
              )}
            </div>
          );
        })()}

        {p.onStyle && (
          <div style={{ marginTop: 16 }}>
            <div role="radiogroup" aria-label="Workout style" style={{ display: 'flex', gap: 5, background: 'var(--control-bg)', borderRadius: 12, padding: 4 }}>
              {([['circuit', 'Circuit'], ['stations', 'Stations']] as const).map(([val, label]) => (
                <button key={val} role="radio" aria-checked={style === val} onClick={() => p.onStyle!(val)}
                  style={{ flex: 1, fontSize: 15, padding: '9px 0', borderRadius: 9, border: 0, cursor: 'pointer', font: 'inherit',
                    fontWeight: style === val ? 600 : 500, background: style === val ? '#fff' : 'transparent', color: style === val ? 'var(--text)' : 'var(--text-muted)',
                    boxShadow: style === val ? '0 0 0 1px var(--border), 0 1px 2px rgba(30,25,40,.05)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>
            <div className="t-hint" style={{ margin: '8px 2px 0' }}>
              {style === 'stations'
                ? `Do all ${rounds} sets of one move (with rest between), then the next.`
                : `Do all moves once, then repeat the whole circuit — ${rounds} rounds.`}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 2 }}>
          <span className="t-label">{style === 'stations' ? 'The moves' : 'The circuit'}</span>
          <span className="t-hint" style={{ fontWeight: 600 }}>{style === 'stations' ? `${rounds} sets each` : `repeat ${rounds}×`}</span>
        </div>
        <WorkoutPreview workout={p.workout} detailed={detailed} onOpenMove={p.onOpenMove} />

        {cores.length > 0 && (() => {
          const cc = catColor('core');
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid var(--divider)', paddingTop: 12, marginTop: 12 }}>
              <i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 20, color: cc.ink, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Core finisher</div>
                <div className="t-hint">
                  {detailed ? cores.map((m) => m.exercise.name).join(' · ') : `${cores.length} ${cores.length === 1 ? 'move' : 'moves'} · to finish`}
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 15 }} />~{Math.round(coreSec / 60)} min
              </span>
            </div>
          );
        })()}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--divider)', fontSize: 14, color: 'var(--text-muted)' }}>
          <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 16 }} />About {total(p.workout)} minutes · {style === 'stations' ? `${rounds} sets each · rest between sets` : `${rounds} rounds · a longer rest between each`}
        </div>

        <button className="btn btn-soft" onClick={p.onReroll} style={{ width: '100%', marginTop: 16, fontSize: 15, padding: '12px' }}>
          <i className="ti ti-refresh" aria-hidden="true" />Different mix
        </button>
      </div>

      {p.onSore && (
        <div style={{ marginBottom: 24 }}>
          <div className="t-label" style={{ marginBottom: 8, marginLeft: 2 }}>
            Anything sore today? <span style={{ color: 'var(--text-hint)', fontWeight: 500 }}>· we'll work around it</span>
          </div>
          <div role="radiogroup" aria-label="Sore area" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SORES.map(({ id, label }) => {
              const selected = sore === id;
              const isSug = p.soreSuggested === id && id !== 'none';
              return (
                <button key={id} role="radio" aria-checked={selected} onClick={() => p.onSore!(id)}
                  style={{ fontSize: 14, fontWeight: 600, padding: '9px 14px', borderRadius: 99, cursor: 'pointer', font: 'inherit', transition: 'transform .12s ease',
                    border: selected ? '1px solid var(--accent)' : '1px solid var(--border)', background: selected ? 'var(--accent)' : '#fff', color: selected ? '#fff' : 'var(--text-muted)' }}>
                  {label}{isSug ? ' ★' : ''}
                </button>
              );
            })}
          </div>
          {p.soreSuggested && p.soreSuggested !== 'none' && suggestedLabel && (
            <div style={{ fontSize: 12, color: 'var(--text-hint)', margin: '8px 2px 0' }}>
              ★ Suggested — rest your {suggestedLabel.toLowerCase()} after last time. Tap to change.
            </div>
          )}
        </div>
      )}

      <div role="radiogroup" aria-label="Workout length" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {KINDS.map((k) => (
          <button key={k} role="radio" aria-checked={p.kind === k} onClick={() => p.onKind(k)}
            style={{ flex: 1, fontSize: 16, padding: '13px 0', borderRadius: 'var(--radius-btn)', cursor: 'pointer', font: 'inherit', transition: 'transform .12s ease',
              border: p.kind === k ? '1px solid var(--accent)' : '1px solid var(--border)', fontWeight: p.kind === k ? 600 : 500,
              background: p.kind === k ? 'var(--accent)' : '#fff', color: p.kind === k ? '#fff' : 'var(--text-muted)' }}>
            {k.replace('min', ' minutes')}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={p.onStart} style={{ width: '100%' }} aria-label="Start workout">
        <i className="ti ti-player-play" aria-hidden="true" />Start workout
      </button>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        <VoicePicker voices={voices} value={voiceURI} onChange={handleVoiceChange} />
      </div>
    </main>
  );
}
