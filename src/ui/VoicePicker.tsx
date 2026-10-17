interface Props {
  voices: SpeechSynthesisVoice[];
  value: string | undefined;
  onChange: (voiceURI: string) => void;
}

// Phones list their voices a moment after the page opens. The picker is there
// (disabled) from the start, so the sheet doesn't grow and shift every button
// up just as you tap.
export function VoicePicker({ voices, value, onChange }: Props) {
  const sorted = [...voices].sort(
    (a, b) => Number(b.lang.startsWith('en')) - Number(a.lang.startsWith('en')),
  );
  return (
    <label className="row muted voice-picker">
      Coach voice
      <select
        aria-label="Coach voice"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="select"
        disabled={voices.length === 0}
      >
        <option value="">Default</option>
        {sorted.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
        ))}
      </select>
    </label>
  );
}
