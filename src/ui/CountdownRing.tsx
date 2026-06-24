interface Props { remaining: number; total: number; }

export function CountdownRing({ remaining, total }: Props) {
  const r = 130;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60).toString().padStart(2, '0');
  return (
    <svg viewBox="0 0 300 300" className="w-72 h-72" aria-hidden="true">
      <circle cx="150" cy="150" r={r} stroke="#1d2733" strokeWidth="14" fill="none" />
      <circle
        cx="150" cy="150" r={r} stroke="#4ade80" strokeWidth="14" fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
        transform="rotate(-90 150 150)"
      />
      <text x="150" y="165" textAnchor="middle" fontSize="64" fill="#f5f7fa" fontWeight="700">
        {mm}:{ss}
      </text>
    </svg>
  );
}
