import { describe, it, expect } from 'vitest';
import { phrases } from './phrases';

describe('phrases', () => {
  it('welcomes Elli by name with the focus', () => {
    const line = phrases.welcome('strength');
    expect(line).toContain('Elli');
    expect(line.toLowerCase()).toContain('strength');
  });

  it('never uses banned (calorie/weight/guilt) language in core lines', () => {
    const lines = [
      phrases.welcome('movement'), phrases.rest(), phrases.begin(),
      phrases.celebrate(['push', 'pull', 'hinge', 'carry', 'mobility']),
      phrases.encourage(() => 0),
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
});
