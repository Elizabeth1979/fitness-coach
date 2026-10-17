import { useState } from 'react';
import type { Equipment, SoreArea, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';
import { ALL_EQUIPMENT } from '../domain/exercises';
import { trainingSec } from '../domain/workout';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';
import { WorkoutPreview } from './WorkoutPreview';
import { warmupMoves, coreMoves } from './format';
import { warmupFlowName } from '../generator/warmupFlows';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface Props {
  workout: Workout; kind: WorkoutKind; onKind: (k: WorkoutKind) => void; streak: number;
  workoutStyle?: WorkoutStyle; onStyle?: (s: WorkoutStyle) => void;
  onSwapWarmup?: () => void;
  sore?: SoreArea; onSore?: (s: SoreArea) => void; soreSuggested?: SoreArea;
  equipment?: Equipment[]; onEquipment?: (e: Equipment[]) => void;
  canResume?: boolean; onResume?: () => void; onReroll: () => void; onStart: () => void;
  onOpenMove: (prepareIndex: number) => void;
  canSwap?: (prepareIndex: number) => boolean;
}
const KINDS: WorkoutKind[] = ['10min', '20min', '30min'];
const SORES: { id: SoreArea; label: string }[] = [
  { id: 'none', label: 'All good' }, { id: 'shoulders', label: 'Shoulders' },
  { id: 'back', label: 'Back' }, { id: 'legs', label: 'Legs' },
];
const EQUIPMENT_CHOICES: { label: string; equipment: Equipment[] }[] = [
  { label: 'Everything', equipment: [...ALL_EQUIPMENT] },
  { label: 'Bodyweight only', equipment: ['bodyweight'] },
];
const isBodyweightOnly = (e: readonly Equipment[]) => e.length === 1 && e[0] === 'bodyweight';
const total = (w: Workout) => Math.round(trainingSec(w) / 60);

// Home is one screen with one job: show today's workout and a big Start.
// Every option lives behind a single "Change workout" sheet.
export function HomeScreen(p: Props) {
  const [changing, setChanging] = useState(false);
  const [hello] = useState(() => greeting(new Date())); // read the clock once, not on every render
  const focus = p.workout.focus;
  const warmups = warmupMoves(p.workout);
  const warmName = warmupFlowName(p.workout.warmupThemeId);
  const cores = coreMoves(p.workout);
  const coreSec = p.workout.segments.filter((s) => s.block === 'core').reduce((a, s) => a + s.durationSec, 0);
  const stations = (p.workoutStyle ?? 'circuit') === 'stations';
  const rounds = p.workout.rounds;

  return (
    <main className="screen screen-home">
      <div className="row-between home-header">
        <div>
          <div className="muted home-greeting">{hello}, Elli <span aria-hidden="true">👋</span></div>
          <h1 className="t-hero">Move With Elli</h1>
        </div>
        {p.streak > 0 && (
          <span className="pill"><Icon name="flame" size={17} className="icon-warm" />{p.streak}-day streak</span>
        )}
      </div>

      {p.canResume && p.onResume && (
        <button className="btn btn-soft btn-block home-resume" onClick={p.onResume}>
          <Icon name="player-play" />Resume where you stopped
        </button>
      )}

      <section className="card home-today" aria-label="Today's workout">
        <div className="row-between home-today-head">
          <h2 className="t-section">Today</h2>
          <span className="muted">{total(p.workout)} min · {focus === 'strength' ? 'Strength' : 'Movement'}</span>
        </div>

        {warmups.length > 0 && (
          <div className="summary-row summary-row--divider-below">
            <Icon name="stretching" />
            <div className="row-main">
              <div className="summary-title">Warm-up{warmName ? ` · ${warmName}` : ''}</div>
              <div className="hint">{warmups.length} {warmups.length === 1 ? 'move' : 'moves'} · first</div>
            </div>
          </div>
        )}

        <div className="row-between home-list-head">
          <span className="eyebrow">{stations ? 'Moves' : 'Circuit'}</span>
          <span className="muted home-rounds">{stations ? `${rounds} sets each` : `${rounds} rounds`}</span>
        </div>
        <div className="hint home-list-hint">Tap a move to see how it's done or swap it</div>
        <WorkoutPreview workout={p.workout} onOpenMove={p.onOpenMove} canSwap={p.canSwap} />

        {cores.length > 0 && (
          <div className="summary-row summary-row--divider-above">
            <Icon name="flame" />
            <div className="row-main">
              <div className="summary-title">Core finisher · ~{Math.round(coreSec / 60)} min</div>
              <div className="hint">{cores.map((m) => m.exercise.name).join(' · ')} · last</div>
            </div>
          </div>
        )}
      </section>

      <button className="btn btn-soft btn-block home-change" onClick={() => setChanging(true)}>
        <Icon name="adjustments-horizontal" />Change workout
      </button>

      <div className="start-bar">
        <button className="btn btn-primary btn-block" onClick={p.onStart} aria-label="Start workout">
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
  const style: WorkoutStyle = p.workoutStyle ?? 'circuit';
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
    <Sheet label="Change workout" onClose={p.onClose}>
      <div className="row-between sheet-head">
        <h2 className="t-section">Change workout</h2>
        <button className="btn btn-soft btn-close" onClick={p.onClose} aria-label="Close">
          <Icon name="x" size={20} />
        </button>
      </div>

      <div className="field">
        <span className="eyebrow">How long?</span>
        <div role="radiogroup" aria-label="Workout length" className="choices">
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
          <div role="radiogroup" aria-label="Sore area" className="choices">
            {SORES.map(({ id, label }) => (
              <button key={id} role="radio" aria-checked={sore === id} className="choice" onClick={() => p.onSore!(id)}>
                {label}{p.soreSuggested === id && id !== 'none' ? ' ★' : ''}
              </button>
            ))}
          </div>
          {p.soreSuggested && p.soreSuggested !== 'none' && suggestedLabel && (
            <div className="hint field-note">★ Suggested: rest your {suggestedLabel.toLowerCase()} after last time.</div>
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
          <div className="hint field-note">
            {style === 'stations'
              ? `All ${rounds} sets of one move, then the next.`
              : `All moves once, then repeat — ${rounds} rounds.`}
          </div>
        </div>
      )}

      {p.onEquipment && (
        <div className="field">
          <span className="eyebrow">Equipment</span>
          <div role="radiogroup" aria-label="Equipment" className="seg">
            {EQUIPMENT_CHOICES.map((c) => (
              <button key={c.label} role="radio" className="seg-btn" onClick={() => p.onEquipment!(c.equipment)}
                aria-checked={isBodyweightOnly(c.equipment) === isBodyweightOnly(p.equipment ?? ALL_EQUIPMENT)}>{c.label}</button>
            ))}
          </div>
          <div className="hint field-note">
            {isBodyweightOnly(p.equipment ?? ALL_EQUIPMENT)
              ? 'No bar, weights or bands — handy when you travel.'
              : 'Uses your pull-up bar, weights and bands.'}
          </div>
        </div>
      )}

      <div className="field">
        <span className="eyebrow">Mix it up</span>
        <div className="choices">
          {p.onSwapWarmup && (
            <button className="btn btn-soft btn-sm" onClick={p.onSwapWarmup}><Icon name="refresh" />New warm-up</button>
          )}
          <button className="btn btn-soft btn-sm" onClick={p.onReroll}><Icon name="refresh" />New moves</button>
        </div>
      </div>

      {voices.length > 0 && (
        <div className="field">
          <VoicePicker voices={voices} value={voiceURI} onChange={handleVoiceChange} />
        </div>
      )}

      <button className="btn btn-dark btn-block" onClick={p.onClose}>Done</button>
    </Sheet>
  );
}
