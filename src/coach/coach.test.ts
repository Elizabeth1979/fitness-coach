import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechCoach, NullCoach } from './coach';

describe('SpeechCoach', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(), cancel: vi.fn(), getVoices: () => [],
    });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text = ''; voice: unknown = null; rate = 1; pitch = 1;
      constructor(t: string) { this.text = t; }
    });
  });

  it('speak() forwards text to speechSynthesis.speak', () => {
    const c = new SpeechCoach();
    c.speak('Rest.');
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('cancel() calls speechSynthesis.cancel', () => {
    const c = new SpeechCoach();
    c.cancel();
    expect(speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('NullCoach is a no-op and never throws', () => {
    const c = new NullCoach();
    expect(() => { c.speak('hi'); c.cancel(); c.prime(); }).not.toThrow();
    expect(c.getVoices()).toEqual([]);
  });
});
