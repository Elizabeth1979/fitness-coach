import { useEffect, useMemo, useState } from 'react';
import type { Category, Workout, WorkoutKind } from './domain/types';
import { generateWorkout } from './generator/generateWorkout';
import { useWorkoutSession } from './ui/useWorkoutSession';
import { HomeScreen } from './ui/HomeScreen';
import { ActiveScreen } from './ui/ActiveScreen';
import { DoneScreen } from './ui/DoneScreen';
import { recordCompletion, currentStreak, getPrefs } from './storage/store';

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

export default function App() {
  const [phase, setPhase] = useState<'home' | 'active' | 'done'>('home');
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [streak, setStreak] = useState(0);
  const { state, start, pause, resume, skip, end } = useWorkoutSession(workout);

  useEffect(() => { setStreak(currentStreak(todayStr())); }, [phase]);

  const categories = useMemo<Category[]>(
    () => (workout?.segments.map((s) => s.exercise?.category).filter(Boolean) as Category[]) ?? [],
    [workout],
  );

  function handleStart(kind: WorkoutKind) {
    const w = generateWorkout({ kind, date: new Date(), equipment: getPrefs().equipment });
    setWorkout(w);
    setPhase('active');
  }

  // Start the session once the workout-bound hook has mounted.
  useEffect(() => {
    if (phase === 'active' && state.status === 'idle' && workout) start();
  }, [phase, state.status, workout, start]);

  // When the engine finishes, record + go to done.
  useEffect(() => {
    if (phase === 'active' && state.status === 'done' && workout) {
      recordCompletion({
        date: todayStr(), kind: workout.kind, focus: workout.focus,
        exerciseIds: workout.segments.flatMap((s) => (s.exercise ? [s.exercise.id] : [])),
        durationSec: workout.segments.reduce((a, s) => a + s.durationSec, 0),
      });
      setPhase('done');
    }
  }, [phase, state.status, workout]);

  if (phase === 'home') return <HomeScreen streak={streak} onStart={handleStart} />;
  if (phase === 'done') return <DoneScreen categories={categories} streak={streak} onHome={() => { setWorkout(null); setPhase('home'); }} />;
  return <ActiveScreen state={state} onPause={pause} onResume={resume} onSkip={skip} onEnd={end} />;
}
