import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoicePicker } from './VoicePicker';

const fakeVoices: SpeechSynthesisVoice[] = [
  { voiceURI: 'uri-en', name: 'Samantha', lang: 'en-US', localService: true, default: true } as unknown as SpeechSynthesisVoice,
  { voiceURI: 'uri-fr', name: 'Thomas', lang: 'fr-FR', localService: true, default: false } as unknown as SpeechSynthesisVoice,
];

describe('VoicePicker', () => {
  it('renders both voice option labels', () => {
    render(<VoicePicker voices={fakeVoices} value={undefined} onChange={() => {}} />);
    expect(screen.getByText('Samantha (en-US)')).toBeInTheDocument();
    expect(screen.getByText('Thomas (fr-FR)')).toBeInTheDocument();
  });

  it('calls onChange with the voiceURI when an option is selected', () => {
    const onChange = vi.fn();
    render(<VoicePicker voices={fakeVoices} value={undefined} onChange={onChange} />);
    const select = screen.getByRole('combobox', { name: /coach voice/i });
    fireEvent.change(select, { target: { value: 'uri-fr' } });
    expect(onChange).toHaveBeenCalledWith('uri-fr');
  });

  it('returns null when voices list is empty', () => {
    const { container } = render(<VoicePicker voices={[]} value={undefined} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
