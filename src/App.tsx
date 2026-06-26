import { useEffect, useMemo, useState } from 'react';
import type { Category, Workout, WorkoutKind, WorkoutStyle } from './domain/types';
import { generateWorkout } from './generator/generateWorkout';
import { useWorkoutSession } from './ui/useWorkoutSession';
import { HomeScreen } from './ui/HomeScreen';
import { ActiveScreen } from './ui/ActiveScreen';
import { DoneScreen } from './ui/DoneScreen';
import { MoveDetail } from './ui/MoveDetail';
import { swapMove } from './generator/swapMove';
import { createRng } from './generator/rng';
import { recordCompletion, currentStreak, getPrefs, setPrefs, getCheckpoint, getRecentThemes, pushRecentTheme } from './storage/store';
import type { Checkpoint } from './storage/store';

function todayStr(): string { return new Date().toISOString().slice(0, 10); }
function daySeed(): number { return Math.floor(Date.now() / 86_400_000); }

export default function App() {
  const [phase, setPhase] = useState<'home' | 'active' | 'done'>('home');
  const initialKind: WorkoutKind = '20min';
  const initialSeed = daySeed();
  const [kind, setKind] = useState<WorkoutKind>(initialKind);
  const [seed, setSeed] = useState<number>(initialSeed);
  const initialStyle: WorkoutStyle = getPrefs().style ?? 'circuit';
  const [style, setStyle] = useState<WorkoutStyle>(initialStyle);
  const [preview, setPreview] = useState<Workout>(() =>
    generateWorkout({ kind: initialKind, date: new Date(), equipment: getPrefs().equipment, recentThemeIds: getRecentThemes(), seed: initialSeed, style: initialStyle }));
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [streak, setStreak] = useState(0);
  const [resumeFrom, setResumeFrom] = useState<{ index: number; elapsedSec: number } | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(() => getCheckpoint());
  const [openPrepare, setOpenPrepare] = useState<number | null>(null);
  const { state, completed, start, pause, resume, skip, end } = useWorkoutSession(workout);

  useEffect(() => {
    setPreview(generateWorkout({ kind, date: new Date(), equipment: getPrefs().equipment, recentThemeIds: getRecentThemes(), seed, style }));
  }, [kind, seed, style]);

  function handleStyle(s: WorkoutStyle) {
    setStyle(s);
    setPrefs({ ...getPrefs(), style: s });
  }

  useEffect(() => {
    setStreak(currentStreak(todayStr()));
    if (phase === 'home') setCheckpoint(getCheckpoint());
  }, [phase]);

  const categories = useMemo<Category[]>(
    () => (workout?.segments.map((s) => s.exercise?.category).filter(Boolean) as Category[]) ?? [], [workout]);

  function handleStart() {
    if (preview.warmupThemeId) pushRecentTheme(preview.warmupThemeId);
    setResumeFrom(null);
    setWorkout(preview);
    setPhase('active');
  }
  function handleSwap(prepareIndex: number) {
    setPreview((w) => swapMove(w, prepareIndex, getPrefs().equipment, createRng(Math.floor(Math.random() * 1e9))));
  }
  function handleResume() {
    const cp = getCheckpoint(); if (!cp) return;
    setResumeFrom({ index: cp.segmentIndex, elapsedSec: cp.elapsedSec });
    setWorkout(cp.workout); setPhase('active');
  }

  useEffect(() => {
    if (phase === 'active' && state.status === 'idle' && workout) start(resumeFrom ?? undefined);
  }, [phase, state.status, workout, start, resumeFrom]);

  useEffect(() => {
    if (phase === 'active' && state.status === 'done' && workout) {
      if (completed) {
        recordCompletion({ date: todayStr(), kind: workout.kind, focus: workout.focus,
          exerciseIds: [...new Set(workout.segments.flatMap((s) => (s.exercise ? [s.exercise.id] : [])))],
          durationSec: workout.segments.reduce((a, s) => a + s.durationSec, 0) });
        setPhase('done');
      } else { setWorkout(null); setPhase('home'); }
    }
  }, [phase, state.status, completed, workout]);

  if (phase === 'home') return (
    <>
      <HomeScreen workout={preview} kind={kind} onKind={setKind} streak={streak}
        style={style} onStyle={handleStyle}
        canResume={!!checkpoint} onResume={handleResume} onReroll={() => setSeed((s) => s + 1)}
        onStart={handleStart} onOpenMove={setOpenPrepare} />
      {openPrepare !== null && (
        <MoveDetail workout={preview} prepareIndex={openPrepare}
          onSwap={() => { handleSwap(openPrepare); setOpenPrepare(null); }} onClose={() => setOpenPrepare(null)} />
      )}
    </>
  );
  if (phase === 'done') return <DoneScreen categories={categories} streak={streak} workout={workout} onHome={() => { setWorkout(null); setPhase('home'); }} />;
  return <ActiveScreen state={state} workout={workout!} onPause={pause} onResume={resume} onSkip={skip} onEnd={end} />;
}
