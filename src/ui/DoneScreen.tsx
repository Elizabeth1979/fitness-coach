import type { Category } from '../domain/types';

interface Props { categories: Category[]; streak: number; onHome: () => void; }
const LABELS: Partial<Record<Category, string>> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', hinge: 'Hinge',
  carry: 'Carry', crawl: 'Crawl', core: 'Core', balance: 'Balance', mobility: 'Mobility',
};

export function DoneScreen({ categories, streak, onHome }: Props) {
  const practiced = Array.from(new Set(categories.map((c) => LABELS[c]).filter(Boolean)));
  return (
    <main className="flex flex-col items-center justify-center h-full p-8 text-center gap-6">
      <h2 className="text-3xl font-semibold">Great job, Elli.</h2>
      <ul className="text-2xl space-y-1">
        {practiced.map((p) => <li key={p}>✓ {p}</li>)}
      </ul>
      {streak > 0 && <p className="text-emerald-400 text-xl">🔥 {streak}-day streak</p>}
      <button onClick={onHome} className="mt-4 px-8 py-4 rounded-2xl bg-emerald-500 text-black text-xl">Done</button>
    </main>
  );
}
