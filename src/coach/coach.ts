export interface Coach {
  speak(text: string): void;
  cancel(): void;
  prime(): void;
  getVoices(): SpeechSynthesisVoice[];
  setVoiceURI(uri: string): void;
}

export class SpeechCoach implements Coach {
  private voiceURI: string | null = null;

  private voice(): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    if (this.voiceURI) return voices.find((v) => v.voiceURI === this.voiceURI) ?? null;
    return voices.find((v) => v.lang.startsWith('en') && v.localService) ?? voices[0] ?? null;
  }

  speak(text: string): void {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = this.voice();
    if (v) u.voice = v;
    u.rate = 0.96;
    u.pitch = 1.0;
    speechSynthesis.speak(u);
  }

  cancel(): void { speechSynthesis.cancel(); }

  // Unlock audio on iOS: must be called from a user gesture.
  prime(): void {
    const u = new SpeechSynthesisUtterance('');
    speechSynthesis.speak(u);
  }

  getVoices(): SpeechSynthesisVoice[] { return speechSynthesis.getVoices(); }
  setVoiceURI(uri: string): void { this.voiceURI = uri; }
}

export class NullCoach implements Coach {
  speak(_text: string): void {}
  cancel(): void {}
  prime(): void {}
  getVoices(): SpeechSynthesisVoice[] { return []; }
  setVoiceURI(_uri: string): void {}
}

export function createCoach(): Coach {
  return typeof speechSynthesis !== 'undefined' ? new SpeechCoach() : new NullCoach();
}
