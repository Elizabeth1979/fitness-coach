import { useState } from 'react';
import type { SoreArea, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';
import { focusForDate } from '../generator/schedule';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';
import { WorkoutPreview } from './WorkoutPreview';
import { warmupMoves, coreMoves } from './format';
import { warmupFlowName } from '../generator/warmupFlows';
import { Icon } from './Icon';

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

// Home is one screen with one job: show today's workout and a big Start.
// Every option lives behind a single "Change workout" sheet.
export function HomeScreen(p: Props) {
  const [changing, setChanging] = useState(false);
  const focus = focusForDate(new Date());
  const warmups = warmupMoves(p.workout);
  const warmName = warmupFlowName(p.workout.warmupThemeId);
  const cores = coreMoves(p.workout);
  const coreSec = p.workout.segments.filter((s) => s.block === 'core').reduce((a, s) => a + s.durationSec, 0);
  const stations = (p.style ?? 'circuit') === 'stations';
  const rounds = p.workout.rounds;

  return (
    <main className="screen" style={{ paddingBottom: 0 }}>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <div>
          <div className="muted" style={{ fontSize: 16 }}>{greeting(new Date())}, Elli <span aria-hidden="true">👋</span></div>
          <h1 className="t-hero">Move With Elli</h1>
        </div>
        {p.streak > 0 && (
          <span className="pill"><Icon name="flame" size={17} style={{ color: 'var(--warm)' }} />{p.streak}-day streak</span>
        )}
      </div>

      {p.canResume && p.onResume && (
        <button className="btn btn-soft" onClick={p.onResume} style={{ width: '100%', marginBottom: 14 }}>
          <Icon name="player-play" />Resume where you stopped
        </button>
      )}

      <section className="card" aria-label="Today's workout" style={{ marginBottom: 14 }}>
        <div className="row-between" style={{ marginBottom: 4 }}>
          <h2 className="t-section">Today</h2>
          <span className="muted">{total(p.workout)} min · {focus === 'strength' ? 'Strength' : 'Movement'}</span>
        </div>

        {warmups.length > 0 && (
          <div className="summary-row" style={{ borderBottom: '1px solid var(--surface-border)' }}>
            <Icon name="stretching" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>Warm-up{warmName ? ` · ${warmName}` : ''}</div>
              <div className="hint">{warmups.length} {warmups.length === 1 ? 'move' : 'moves'} · first</div>
            </div>
          </div>
        )}

        <div className="row-between" style={{ margin: '14px 0 2px' }}>
          <span className="eyebrow">{stations ? 'Moves' : 'Circuit'}</span>
          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{stations ? `${rounds} sets each` : `${rounds} rounds`}</span>
        </div>
        <div className="hint" style={{ marginBottom: 4 }}>Tap a move to swap it</div>
        <WorkoutPreview workout={p.workout} onOpenMove={p.onOpenMove} />

        {cores.length > 0 && (
          <div className="summary-row" style={{ borderTop: '1px solid var(--surface-border)' }}>
            <Icon name="flame" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>Core finisher · ~{Math.round(coreSec / 60)} min</div>
              <div className="hint">{cores.map((m) => m.exercise.name).join(' · ')} · last</div>
            </div>
          </div>
        )}
      </section>

      <button className="btn btn-soft" onClick={() => setChanging(true)} style={{ width: '100%', marginBottom: 18 }}>
        <Icon name="adjustments-horizontal" />Change workout
      </button>

      <div className="start-bar">
        <button className="btn btn-primary" onClick={p.onStart} style={{ width: '100%' }} aria-label="Start workout">
          <Icon name="player-play" />Start workout
        </button>
      </div>

      {changing && <ChangeSheet {...p} onClose={() => setChanging(false)} />}
    </main>
  );
}

function ChangeSheet(p: Props & { onClose: () => void }) {
  const voices = useVoices();
  const [voiceURI, setVoiceURI] = useState<string | undefined>(() => getPrefs().voiceURI);
  const style: WorkoutStyle = p.style ?? 'circuit';
  const sore: SoreArea = p.sore ?? 'none';
  const suggestedLabel = SORES.find((s) => s.id === p.soreSuggested)?.label;
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
    <div className="sheet-backdrop" onClick={p.onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Change workout" onClick={(e) => e.stopPropagation()}>
        <div className="row-between" style={{ marginBottom: 20 }}>
          <h2 className="t-section">Change workout</h2>
          <button className="btn btn-soft" onClick={p.onClose} aria-label="Close" style={{ padding: 9, minHeight: 44, borderRadius: 12 }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="field">
          <span className="eyebrow">How long?</span>
          <div role="radiogroup" aria-label="Workout length" style={{ display: 'flex', gap: 8 }}>
            {KINDS.map((k) => (
              <button key={k} role="radio" aria-checked={p.kind === k} className="choice choice--block" onClick={() => p.onKind(k)}>
                {k.replace('min', ' min')}
              </button>
            ))}
          </div>
        </div>

        {p.onSore && (
          <div className="field">
            <span className="eyebrow">Anything sore?</span>
            <div role="radiogroup" aria-label="Sore area" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SORES.map(({ id, label }) => (
                <button key={id} role="radio" aria-checked={sore === id} className="choice" onClick={() => p.onSore!(id)}>
                  {label}{p.soreSuggested === id && id !== 'none' ? ' ★' : ''}
                </button>
              ))}
            </div>
            {p.soreSuggested && p.soreSuggested !== 'none' && suggestedLabel && (
              <div className="hint" style={{ marginTop: 8 }}>★ Suggested: rest your {suggestedLabel.toLowerCase()} after last time.</div>
            )}
          </div>
        )}

        {p.onStyle && (
          <div className="field">
            <span className="eyebrow">How to repeat</span>
            <div role="radiogroup" aria-label="Workout style" className="seg">
              {([['circuit', 'Circuit'], ['stations', 'Stations']] as const).map(([val, label]) => (
                <button key={val} role="radio" aria-checked={style === val} className="seg-btn" onClick={() => p.onStyle!(val)}>{label}</button>
              ))}
            </div>
            <div className="hint" style={{ marginTop: 8 }}>
              {style === 'stations'
                ? `All ${rounds} sets of one move, then the next.`
                : `All moves once, then repeat — ${rounds} rounds.`}
            </div>
          </div>
        )}

        <div className="field">
          <span className="eyebrow">Mix it up</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {p.onSwapWarmup && (
              <button className="btn btn-soft btn-sm" onClick={p.onSwapWarmup} style={{ flex: 1 }}><Icon name="refresh" />New warm-up</button>
            )}
            <button className="btn btn-soft btn-sm" onClick={p.onReroll} style={{ flex: 1 }}><Icon name="refresh" />New moves</button>
          </div>
        </div>

        {voices.length > 0 && (
          <div className="field">
            <VoicePicker voices={voices} value={voiceURI} onChange={handleVoiceChange} />
          </div>
        )}

        <button className="btn btn-dark" onClick={p.onClose} style={{ width: '100%' }}>Done</button>
      </div>
    </div>
  );
}
