interface Props { remaining: number; total: number; color?: string }
export function TimerRing({ remaining, total, color = '#5d4a7e' }: Props) {
  const r = 86, c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mm = Math.floor(remaining / 60), ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${Math.round(remaining)} seconds remaining`}>
        <circle cx="100" cy="100" r={r} fill="#fff" stroke="#efedf2" strokeWidth="12" />
        <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset .35s linear, stroke .3s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>{mm}:{ss}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-hint)', marginTop: 4 }}>remaining</div>
      </div>
    </div>
  );
}
