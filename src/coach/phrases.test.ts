import { describe, it, expect } from 'vitest';
import { phrases } from './phrases';

describe('phrases', () => {
  const overview = (over: Partial<Parameters<typeof phrases.introOverview>[0]> = {}) => phrases.introOverview({
    minutes: 20, focus: 'strength', warmup: 'Hip Flow', moves: ['Push-up', 'Row', 'Squat'], rounds: 3, style: 'circuit', core: true, ...over,
  });

  it('the intro welcomes Elli and says what is waiting', () => {
    expect(overview()).toBe('Welcome back, Elli. Today is 20 minutes of strength and mobility. '
      + 'Warm-up: Hip Flow. Then 3 rounds of Push-up, Row and Squat. We finish with core.');
    expect(overview({ style: 'stations', core: false })).toContain('Then 3 sets each of Push-up, Row and Squat.');
    expect(overview({ style: 'stations', core: false })).not.toContain('core');
  });

  it('never uses banned (calorie/weight/guilt) language in core lines', () => {
    const lines = [
      overview(), phrases.rest(), phrases.begin(),
      phrases.celebrate(['push', 'pull', 'hinge', 'carry', 'mobility']),
      ...phrases.encouragements,
    ];
    const banned = /calorie|weight loss|burn|fat|harder|no excuses|guilt/i;
    for (const l of lines) expect(l).not.toMatch(banned);
  });

  it('howTo says the name once, then how to do it', () => {
    expect(phrases.howTo({ name: 'Hip Circles', cue: 'Hip circles. Hands on hips, big slow circles each way.' }))
      .toBe('Hip Circles. Hands on hips, big slow circles each way.');
    expect(phrases.howTo({ name: 'Push-up', cue: 'Push-ups. Hands under shoulders, body in one line.' }))
      .toBe('Push-up. Hands under shoulders, body in one line.');
    expect(phrases.howTo({ name: 'Hip Shifts', cue: 'On all fours, rock the hips back and forth.' }))
      .toBe('Hip Shifts. On all fours, rock the hips back and forth.');
  });

  it('celebrate lists the practiced categories', () => {
    const line = phrases.celebrate(['push', 'pull']);
    expect(line.toLowerCase()).toContain('push');
    expect(line.toLowerCase()).toContain('pull');
  });

  it('announces round completion and the next round, no banned language', () => {
    expect(phrases.roundComplete(1, 3)).toContain('Round 1 of 3');
    expect(phrases.roundStart(2)).toContain('Round 2');
    const banned = /calorie|weight loss|burn|fat|harder|no excuses|guilt/i;
    for (const l of [phrases.roundComplete(1, 3), phrases.roundStart(2)]) {
      expect(l).not.toMatch(banned);
    }
  });

  it('has a big, varied encouragement list: short, kind, no duplicates', () => {
    const list = phrases.encouragements;
    expect(list.length).toBeGreaterThanOrEqual(30);
    // Short enough to finish well before an exercise's closing "three-two-one".
    for (const l of list) {
      expect(l.trim(), 'empty line').not.toBe('');
      expect(l.split(/\s+/).length, l).toBeLessThanOrEqual(8);
    }
    expect(new Set(list.map((l) => l.toLowerCase())).size).toBe(list.length);
  });

  it('deals encouragements like a shuffled deck: no repeats until all are used, never twice in a row', () => {
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const next = phrases.encouragementDeck(rng);
    const n = phrases.encouragements.length;
    const firstPass = Array.from({ length: n }, next);
    expect(new Set(firstPass).size).toBe(n);
    let prev = firstPass[n - 1];
    for (let i = 0; i < 3 * n; i++) {
      const line = next();
      expect(line).not.toBe(prev);
      prev = line;
    }
  });
});
