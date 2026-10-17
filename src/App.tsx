import { useEffect, useMemo, useState } from 'react';
import type { Category, Equipment, SoreArea, Workout, WorkoutKind, WorkoutStyle } from './domain/types';
import { generateWorkout } from './generator/generateWorkout';
import { trainingSec } from './domain/workout';
import { useWorkoutSession } from './ui/useWorkoutSession';
import { HomeScreen } from './ui/HomeScreen';
import { ActiveScreen } from './ui/ActiveScreen';
import { DoneScreen } from './ui/DoneScreen';
import { MoveDetail } from './ui/MoveDetail';
import { canSwap, swapMove } from './generator/swapMove';
import { WARMUP_FLOWS } from './generator/warmupFlows';
import { createRng } from './generator/rng';
import { recordCompletion, currentStreak, getPrefs, setPrefs, getCheckpoint, getRecentThemes, pushRecentTheme, suggestedSore } from './storage/store';
import type { Checkpoint } from './storage/store';
import { setBusy } from './pwa/update';
import { useBackButton } from './ui/useBackButton';
import { localDate, localDayNumber } from './domain/date';

const today = (): string => localDate(new Date());

export default function App() {
  const [phase, setPhase] = useState<'home' | 'active' | 'done'>('home');
  // Read once when the app opens: the day (seed + focus) and the warm-up history.
  const [openedAt] = useState(() => new Date());
  const [recentThemes] = useState(getRecentThemes);
  const [kind, setKind] = useState<WorkoutKind>('20min');
  const [seed, setSeed] = useState(() => localDayNumber(openedAt));
  const [style, setStyle] = useState<WorkoutStyle>(() => getPrefs().style ?? 'circuit');
  const [warmupTheme, setWarmupTheme] = useState<string | undefined>(undefined);
  // Pre-select today's sore area from the last session (recover what you trained).
  const [soreSuggested] = useState(suggestedSore);
  const [sore, setSore] = useState<SoreArea>(soreSuggested);
  const [equipment, setEquipment] = useState<Equipment[]>(() => getPrefs().equipment);
  // Today's workout follows from the choices above. A swapped move is kept only
  // while those choices stay the same (it belongs to the workout it was made on).
  const generated = useMemo(
    () => generateWorkout({ kind, date: openedAt, equipment, recentThemeIds: recentThemes, seed, style, warmupThemeId: warmupTheme, sore }),
    [kind, openedAt, equipment, recentThemes, seed, style, warmupTheme, sore]);
  const [swapped, setSwapped] = useState<{ base: Workout; workout: Workout } | null>(null);
  const preview = swapped?.base === generated ? swapped.workout : generated;
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [streak, setStreak] = useState(() => currentStreak(today()));
  const [resumeFrom, setResumeFrom] = useState<{ index: number; elapsedSec: number } | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(() => getCheckpoint(today()));
  const [openPrepare, setOpenPrepare] = useState<number | null>(null);
  const { state, start, pause, resume, skip, end, musicOn, toggleMusic, musicAvailable } = useWorkoutSession(workout, handleFinished);

  function handleSore(s: SoreArea) { setWarmupTheme(undefined); setSore(s); }

  // Re-roll, change length, or change style → drop the warm-up override so the
  // Lottery picks fresh again.
  function handleKind(k: WorkoutKind) { setWarmupTheme(undefined); setKind(k); }
  function handleReroll() { setWarmupTheme(undefined); setSeed((s) => s + 1); }
  function handleEquipment(e: Equipment[]) {
    setEquipment(e);
    setPrefs({ ...getPrefs(), equipment: e });
  }
  function handleStyle(s: WorkoutStyle) {
    setWarmupTheme(undefined);
    setStyle(s);
    setPrefs({ ...getPrefs(), style: s });
  }
  // "Different warm-up": force a different flow than the one currently shown.
  function handleSwapWarmup() {
    const choices = WARMUP_FLOWS.map((f) => f.id).filter((id) => id !== preview.warmupThemeId);
    if (choices.length === 0) return;
    setWarmupTheme(choices[Math.floor(Math.random() * choices.length)]);
  }

  // The phone's Back goes home instead of quitting the app. Mid-workout it pauses
  // first, which saves the spot, so Home offers "Resume where you stopped".
  useBackButton(phase !== 'home', () => {
    if (phase === 'active') pause();
    goHome();
  });

  // A new app version can only reload the page while you're on the home screen.
  useEffect(() => { setBusy(phase !== 'home'); }, [phase]);

  function goHome() {
    setWorkout(null);
    setPhase('home');
    setCheckpoint(getCheckpoint(today())); // an unfinished workout can be resumed
  }
  // Only a natural finish counts towards the streak; ending early just goes home.
  function handleFinished(completed: boolean) {
    if (!workout) return;
    if (!completed) { goHome(); return; }
    recordCompletion({ date: today(), kind: workout.kind, focus: workout.focus,
      exerciseIds: [...new Set(workout.segments.flatMap((s) => (s.exercise ? [s.exercise.id] : [])))],
      durationSec: trainingSec(workout), sore });
    setStreak(currentStreak(today()));
    setPhase('done');
  }

  const categories = useMemo<Category[]>(
    () => (workout?.segments.map((s) => s.exercise?.category).filter(Boolean) as Category[]) ?? [], [workout]);

  function handleStart() {
    if (preview.warmupThemeId) pushRecentTheme(preview.warmupThemeId);
    setResumeFrom(null);
    setWorkout(preview);
    setPhase('active');
  }
  function handleSwap(prepareIndex: number) {
    setSwapped({ base: generated, workout: swapMove(preview, prepareIndex, equipment, createRng(Math.floor(Math.random() * 1e9))) });
  }
  function handleResume() {
    const cp = getCheckpoint(today()); if (!cp) return;
    setResumeFrom({ index: cp.segmentIndex, elapsedSec: cp.elapsedSec });
    setWorkout(cp.workout); setPhase('active');
  }

  useEffect(() => {
    if (phase === 'active' && state.status === 'idle' && workout) start(resumeFrom ?? undefined);
  }, [phase, state.status, workout, start, resumeFrom]);

  if (phase === 'home') return (
    <>
      <HomeScreen workout={preview} kind={kind} onKind={handleKind} streak={streak}
        workoutStyle={style} onStyle={handleStyle} onSwapWarmup={handleSwapWarmup}
        sore={sore} onSore={handleSore} soreSuggested={soreSuggested}
        canResume={!!checkpoint} onResume={handleResume} onReroll={handleReroll}
        onStart={handleStart} onOpenMove={setOpenPrepare}
        equipment={equipment} onEquipment={handleEquipment}
        canSwap={(i) => canSwap(preview, i, equipment)} />
      {openPrepare !== null && (
        <MoveDetail workout={preview} prepareIndex={openPrepare} canSwap={canSwap(preview, openPrepare, equipment)}
          onSwap={() => { handleSwap(openPrepare); setOpenPrepare(null); }} onClose={() => setOpenPrepare(null)} />
      )}
    </>
  );
  if (phase === 'done') return <DoneScreen categories={categories} streak={streak} workout={workout} onHome={goHome} />;
  return <ActiveScreen state={state} workout={workout!} onPause={pause} onResume={resume} onSkip={skip} onEnd={end}
    musicOn={musicOn} onToggleMusic={toggleMusic} musicAvailable={musicAvailable} />;
}
