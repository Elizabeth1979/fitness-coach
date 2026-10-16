interface Props { remaining: number; total: number; tone?: 'work' | 'rest' }

/** Countdown ring. Colours come from index.css: green while you work, grey while you rest. */
export function TimerRing({ remaining, total, tone = 'work' }: Props) {
  const r = 86, c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mm = Math.floor(remaining / 60), ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  return (
    <div className="timer-ring" data-tone={tone}>
      <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${Math.round(remaining)} seconds remaining`}>
        <circle className="timer-track" cx="100" cy="100" r={r} strokeWidth="15" />
        <circle className="timer-fill" cx="100" cy="100" r={r} strokeWidth="15" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 100 100)" />
      </svg>
      <div className="timer-readout">
        <div className="timer-time">{mm}:{ss}</div>
        <div className="timer-label">remaining</div>
      </div>
    </div>
  );
}
