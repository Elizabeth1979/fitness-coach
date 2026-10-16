import type { Category, Exercise, Focus } from '../domain/types';
// The coach's encouragement lines live in their own JSON file so they're easy to
// add to or edit (keep each one short — it's said mid-exercise).
import ENCOURAGEMENT_LINES from './encouragements.json';

const FOCUS_LABEL: Record<Focus, string> = {
  strength: 'strength and mobility',
  movement: 'movement and play',
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

const ENCOURAGEMENTS: readonly string[] = ENCOURAGEMENT_LINES;

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The how-to part of an exercise cue. Most cues open by repeating the move's
// name ("Hip circles. Hands on hips…"); drop that so the name isn't said twice.
function form(ex: Pick<Exercise, 'name' | 'cue'>): string {
  const [first, ...rest] = ex.cue.split('. ');
  const isName = rest.length > 0 && first.toLowerCase().replace(/s$/, '') === ex.name.toLowerCase().replace(/s$/, '');
  return isName ? rest.join('. ') : ex.cue;
}

const CATEGORY_LABEL: Partial<Record<Category, string>> = {
  push: 'push', pull: 'pull', legs: 'legs', hinge: 'hinge',
  carry: 'carry', crawl: 'crawl', core: 'core', balance: 'balance',
  mobility: 'mobility', warmup: 'warm-up',
};

export const phrases = {
  welcome: (focus: Focus): string =>
    `Welcome back, Elli. Today's focus is ${FOCUS_LABEL[focus]}. Let's begin.`,
  exercise: (name: string): string => `${name}.`,
  form,
  // Name + how to do it.
  howTo: (ex: Pick<Exercise, 'name' | 'cue'>): string => `${phrases.exercise(ex.name)} ${form(ex)}`,
  begin: (): string => 'Go!',
  rest: (): string => 'Rest. Take a deep breath.',
  nextUp: (ex: Pick<Exercise, 'name' | 'cue'>): string => `Next up: ${phrases.howTo(ex)}`,
  getReady: (): string => 'Get ready.',
  warmupAnnounce: (flowName: string): string => `Today's warm-up: ${flowName}.`,
  coreFinisher: (): string => 'Last bit — core finisher.',
  count: (n: number): string => NUMBER_WORDS[n] ?? String(n),
  encouragements: ENCOURAGEMENTS,
  /**
   * Deals encouragement lines like a shuffled deck: no line repeats until every
   * one has been used, and never the same line twice in a row across a reshuffle.
   */
  encouragementDeck: (rng: () => number): (() => string) => {
    let deck: string[] = [];
    let last = '';
    return () => {
      if (deck.length === 0) {
        deck = shuffled(ENCOURAGEMENTS, rng);
        // pop() deals from the end; keep the line just said away from it.
        if (deck.length > 1 && deck[deck.length - 1] === last) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
      }
      last = deck.pop()!;
      return last;
    };
  },
  celebrate: (categories: Category[]): string => {
    const labels = Array.from(new Set(categories.map((c) => CATEGORY_LABEL[c] ?? c)));
    return `Great job, Elli. Today you practiced ${labels.join(', ')}. You're more capable than yesterday.`;
  },
  roundComplete: (round: number, total: number): string =>
    `Round ${round} of ${total} complete. Rest up.`,
  roundStart: (round: number): string => `Round ${round}. Here we go.`,
};
