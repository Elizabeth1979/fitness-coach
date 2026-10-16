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
import { catVars } from './catVars';

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
      <div className="row-between" style={{ marginBottom: 16 }}>
        <div>
          <div className="muted" style={{ fontSize: 16 }}>{greeting(new Date())}, Elli <span aria-hidden="true">👋</span></div>
          <h1 className="t-hero">Move With Elli</h1>
        </div>
        {p.streak > 0 && (
          <span className="pill pill-warm" style={{ padding: '8px 12px' }}>
            <i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 17 }} />{p.streak}-day streak
          </span>
        )}
      </div>

      {p.canResume && p.onResume && (
        <button className="btn btn-warm" onClick={p.onResume} style={{ width: '100%', marginBottom: 12 }}>
          <i className="ti ti-refresh" aria-hidden="true" />Resume workout
        </button>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <div className="t-section">Today · {focus === 'strength' ? 'Strength' : 'Movement'}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="pill"><i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{total(p.workout)} minutes</span>
            <span className="pill"><i className="ti ti-repeat" aria-hidden="true" style={{ fontSize: 14 }} />{rounds} {style === 'stations' ? 'sets' : 'rounds'}</span>
          </div>
        </div>

        <div role="group" aria-label="Detail level" className="seg" style={{ marginBottom: 14 }}>
          {[['Compact', false], ['Detailed', true]].map(([label, val]) => (
            <button key={label as string} className="seg-btn" onClick={() => setDetailed(val as boolean)} aria-pressed={detailed === val}>
              {label as string}
            </button>
          ))}
        </div>

        {warmups.length > 0 && (() => {
          const wc = catColor('warmup');
          return (
            <div className="panel" style={{ ...catVars(wc), marginBottom: 6 }}>
              <div className="row" style={{ gap: 11 }}>
                <span className="icon-badge"><i className="ti ti-stretching" aria-hidden="true" style={{ fontSize: 22 }} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-panel">Warm-up{warmName ? ` · ${warmName}` : ''}</div>
                  <div className="hint">{warmups.length} {warmups.length === 1 ? 'move' : 'moves'} · once at the start</div>
                </div>
              </div>

              {/* Detailed: the full numbered list. Compact: header only (no move list). */}
              {detailed && (
                <div style={{ marginTop: 9 }}>
                  {warmups.map((m, i) => (
                    <div key={m.firstSegment} className="flow-row">
                      <span className="num-badge" aria-hidden="true">{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600 }}>{m.exercise.name}</span>
                      <span className="row muted" style={{ gap: 4, fontSize: 'var(--fs-xs)' }}>
                        <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 14 }} />{m.target}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {p.onSwapWarmup && (
                <button className="btn-cat" onClick={p.onSwapWarmup} style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontWeight: 800 }}>
                  <i className="ti ti-refresh" aria-hidden="true" />Different warm-up
                </button>
              )}
            </div>
          );
        })()}

        {p.onStyle && (
          <div style={{ marginTop: 14 }}>
            <div role="radiogroup" aria-label="Workout style" className="seg">
              {([['circuit', 'Circuit'], ['stations', 'Stations']] as const).map(([val, label]) => (
                <button key={val} role="radio" aria-checked={style === val} className="seg-btn" onClick={() => p.onStyle!(val)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="hint" style={{ margin: '7px 2px 0' }}>
              {style === 'stations'
                ? `Do all ${rounds} sets of one move (with rest between), then the next.`
                : `Do all moves once, then repeat the whole circuit — ${rounds} rounds.`}
            </div>
          </div>
        )}

        <div className="row-between" style={{ marginTop: 16, marginBottom: 2 }}>
          <span className="eyebrow">{style === 'stations' ? 'The moves' : 'The circuit'}</span>
          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{style === 'stations' ? `${rounds} sets each` : `repeat ${rounds}×`}</span>
        </div>
        <div className="row hint" style={{ gap: 5, margin: '3px 2px 2px' }}>
          <i className="ti ti-hand-finger" aria-hidden="true" style={{ fontSize: 15 }} />Tap any move to swap it
        </div>
        <WorkoutPreview workout={p.workout} detailed={detailed} onOpenMove={p.onOpenMove} />

        {cores.length > 0 && (() => {
          const cc = catColor('core');
          return (
            <div className="panel row" style={{ ...catVars(cc), gap: 11, marginTop: 12 }}>
              <span className="icon-badge"><i className="ti ti-flame" aria-hidden="true" style={{ fontSize: 20 }} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t-panel">Core finisher</div>
                <div className="hint">
                  {detailed ? cores.map((m) => m.exercise.name).join(' · ') : `${cores.length} ${cores.length === 1 ? 'move' : 'moves'} · to finish`}
                </div>
              </div>
              <span className="row" style={{ gap: 5, fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--cat)' }}>
                <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 15 }} />~{Math.round(coreSec / 60)} min
              </span>
            </div>
          );
        })()}

        <div className="row muted" style={{ gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--surface-border)', fontSize: 'var(--fs-xs)' }}>
          <i className="ti ti-clock" aria-hidden="true" style={{ fontSize: 16 }} />About {total(p.workout)} minutes · {style === 'stations' ? `${rounds} sets each · rest between sets` : `${rounds} rounds · a longer rest between each`}
        </div>

        <button className="btn btn-soft" onClick={p.onReroll} style={{ width: '100%', marginTop: 12, fontSize: 16, padding: 12, minHeight: 0 }}>
          <i className="ti ti-refresh" aria-hidden="true" />Different mix
        </button>
      </div>

      {p.onSore && (
        <div style={{ marginBottom: 16 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 8, marginLeft: 2 }}>
            Anything sore today? <span className="hint" style={{ fontWeight: 500 }}>· we'll work around it</span>
          </div>
          <div role="radiogroup" aria-label="Sore area" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {SORES.map(({ id, label }) => {
              const selected = sore === id;
              const isSug = p.soreSuggested === id && id !== 'none';
              return (
                <button key={id} role="radio" aria-checked={selected} className="choice" onClick={() => p.onSore!(id)}>
                  {label}{isSug ? ' ★' : ''}
                </button>
              );
            })}
          </div>
          {p.soreSuggested && p.soreSuggested !== 'none' && suggestedLabel && (
            <div className="hint" style={{ fontSize: 12, margin: '7px 2px 0' }}>
              ★ Suggested — rest your {suggestedLabel.toLowerCase()} after last time. Tap to change.
            </div>
          )}
        </div>
      )}

      <div role="radiogroup" aria-label="Workout length" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {KINDS.map((k) => (
          <button key={k} role="radio" aria-checked={p.kind === k} className="choice choice--block" onClick={() => p.onKind(k)}>
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
