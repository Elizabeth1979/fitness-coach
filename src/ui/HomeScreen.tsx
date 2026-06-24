import { useState } from 'react';
import type { WorkoutKind } from '../domain/types';
import { focusForDate } from '../generator/schedule';
import { getPrefs, setPrefs } from '../storage/store';
import { useVoices } from './useVoices';
import { VoicePicker } from './VoicePicker';

interface Props { streak: number; onStart: (kind: WorkoutKind) => void; }
const KINDS: WorkoutKind[] = ['10min', '20min', '30min'];

export function HomeScreen({ streak, onStart }: Props) {
  const [kind, setKind] = useState<WorkoutKind>('20min');
  const voices = useVoices();
  const [voiceURI, setVoiceURI] = useState<string | undefined>(() => getPrefs().voiceURI);
  const focus = focusForDate(new Date());

  function handleVoiceChange(uri: string) {
    const next = uri || undefined;
    setVoiceURI(next);
    setPrefs({ ...getPrefs(), voiceURI: next });
    if (typeof speechSynthesis !== 'undefined' && next) {
      const u = new SpeechSynthesisUtterance('Hi Elli, ready to move?');
      const v = voices.find((x) => x.voiceURI === next);
      if (v) u.voice = v;
      u.rate = 0.96;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  }
  const label = focus === 'strength' ? 'Strength' : 'Movement';
  return (
    <main className="flex flex-col items-center justify-between h-full p-8 text-center">
      <header className="pt-6">
        <h1 className="text-3xl font-semibold">Move With Elli</h1>
        <p className="mt-2 text-lg text-slate-400">Today: {label} · {kind.replace('min', ' min')}</p>
        {streak > 0 && <p className="mt-1 text-emerald-400">🔥 {streak}-day streak</p>}
      </header>

      <div role="radiogroup" aria-label="Workout length" className="flex gap-3">
        {KINDS.map((k) => (
          <button
            key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
            className={`px-5 py-3 rounded-2xl text-lg ${kind === k ? 'bg-emerald-500 text-black' : 'bg-slate-800'}`}
          >
            {k.replace('min', ' min')}
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(kind)}
        className="w-full max-w-sm py-10 rounded-3xl bg-emerald-500 text-black text-4xl font-bold active:scale-[0.98] transition"
        aria-label={`Start ${kind} workout`}
      >
        ▶ Start
      </button>
      <VoicePicker voices={voices} value={voiceURI} onChange={handleVoiceChange} />
    </main>
  );
}
