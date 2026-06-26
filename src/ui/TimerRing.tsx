interface Props { remaining: number; total: number; from?: string; to?: string }
export function TimerRing({ remaining, total, from = '#7c3aed', to = '#fb7185' }: Props) {
  const r = 86, c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mm = Math.floor(remaining / 60), ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${Math.round(remaining)} seconds remaining`}>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="#fff" stroke="#f0e7fb" strokeWidth="14" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset .35s linear', filter: 'drop-shadow(0 3px 8px rgba(168,40,180,.28))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1 }}>{mm}:{ss}</div>
        <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 4 }}>remaining</div>
      </div>
    </div>
  );
}
