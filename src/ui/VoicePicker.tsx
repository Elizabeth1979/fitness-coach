interface Props {
  voices: SpeechSynthesisVoice[];
  value: string | undefined;
  onChange: (voiceURI: string) => void;
}

export function VoicePicker({ voices, value, onChange }: Props) {
  if (voices.length === 0) return null;
  const sorted = [...voices].sort(
    (a, b) => Number(b.lang.startsWith('en')) - Number(a.lang.startsWith('en')),
  );
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
      Coach voice
      <select
        aria-label="Coach voice"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ font: 'inherit', color: 'var(--text)', background: 'var(--control-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px 8px', maxWidth: '12rem' }}
      >
        <option value="">Default</option>
        {sorted.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
        ))}
      </select>
    </label>
  );
}
