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
    const banned = /calorie|weight loss|burn|fat|harder|no excuses/i;
    for (const l of lines) expect(l).not.toMatch(banned);
  });

  it('celebrate lists the practiced categories', () => {
    const line = phrases.celebrate(['push', 'pull']);
    expect(line.toLowerCase()).toContain('push');
    expect(line.toLowerCase()).toContain('pull');
  });
});
