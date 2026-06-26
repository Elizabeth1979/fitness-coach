import type { Category, Focus } from '../domain/types';

const FOCUS_LABEL: Record<Focus, string> = {
  strength: 'strength and mobility',
  movement: 'movement and play',
};

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

const ENCOURAGEMENTS = [
  'Beautiful work.',
  'Smooth and strong.',
  "You're getting stronger.",
  'Stay with it, you look great.',
  'Lovely control.',
];

const CATEGORY_LABEL: Partial<Record<Category, string>> = {
  push: 'push', pull: 'pull', legs: 'legs', hinge: 'hinge',
  carry: 'carry', crawl: 'crawl', core: 'core', balance: 'balance',
  mobility: 'mobility', warmup: 'warm-up',
};

export const phrases = {
  welcome: (focus: Focus): string =>
    `Welcome back, Elli. Today's focus is ${FOCUS_LABEL[focus]}. Let's begin.`,
  exercise: (name: string): string => `${name}.`,
  begin: (): string => 'Begin.',
  rest: (): string => 'Rest. Take a deep breath.',
  next: (name: string): string => `Next exercise. ${name}.`,
  warmupAnnounce: (flowName: string): string => `Today's warm-up: ${flowName}.`,
  coreFinisher: (): string => 'Last bit — core finisher.',
  count: (n: number): string => NUMBER_WORDS[n] ?? String(n),
  encourage: (rng: () => number): string =>
    ENCOURAGEMENTS[Math.floor(rng() * ENCOURAGEMENTS.length)],
  celebrate: (categories: Category[]): string => {
    const labels = Array.from(new Set(categories.map((c) => CATEGORY_LABEL[c] ?? c)));
    return `Great job, Elli. Today you practiced ${labels.join(', ')}. You're more capable than yesterday.`;
  },
  roundComplete: (round: number, total: number): string =>
    `Round ${round} of ${total} complete. Rest up.`,
  roundStart: (round: number): string => `Round ${round}. Here we go.`,
};
