import type { SessionState } from '../engine/session';
import { CountdownRing } from './CountdownRing';

interface Props {
  state: SessionState;
  onPause: () => void; onResume: () => void; onSkip: () => void; onEnd: () => void;
}

export function ActiveScreen({ state, onPause, onResume, onSkip, onEnd }: Props) {
  const seg = state.segment;
  const isRest = seg?.kind === 'rest';
  const title = isRest ? 'Rest' : seg?.exercise?.name ?? 'Get ready';
  const side = seg?.side ? ` · ${seg.side}` : '';
  return (
    <main className={`flex flex-col items-center justify-between h-full p-8 ${isRest ? 'bg-sky-950' : ''}`}>
      <p className="sr-only" aria-live="assertive">{title}{side}</p>
      <h2 className="pt-10 text-4xl font-bold text-center">{title}<span className="text-slate-400">{side}</span></h2>
      <CountdownRing remaining={state.segmentRemainingSec} total={seg?.durationSec ?? 1} />
      <div className="flex gap-4 w-full max-w-sm">
        {state.status === 'paused'
          ? <button onClick={onResume} className="flex-1 py-5 rounded-2xl bg-emerald-500 text-black text-xl">Resume</button>
          : <button onClick={onPause} className="flex-1 py-5 rounded-2xl bg-slate-800 text-xl">Pause</button>}
        <button onClick={onSkip} className="flex-1 py-5 rounded-2xl bg-slate-800 text-xl">Skip</button>
        <button onClick={onEnd} aria-label="End workout" className="px-5 py-5 rounded-2xl bg-slate-800 text-xl">✕</button>
      </div>
    </main>
  );
}
