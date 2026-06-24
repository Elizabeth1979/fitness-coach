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
    <label className="flex items-center gap-2 text-sm text-slate-400">
      Coach voice
      <select
        aria-label="Coach voice"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 text-slate-200 rounded-lg px-2 py-1 max-w-[12rem]"
      >
        <option value="">Default</option>
        {sorted.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
        ))}
      </select>
    </label>
  );
}
