import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import type { Workout } from '../domain/types';
import { WorkoutSession, type SessionState } from '../engine/session';
import { RafClock } from '../engine/clock';
import { createCoach } from '../coach/coach';
import { createFeedback } from '../feedback/feedback';
import { createBeats } from '../feedback/beats';
import { requestWakeLock, releaseWakeLock } from '../pwa/wakeLock';
import { getPrefs, setPrefs, saveCheckpoint, clearCheckpoint } from '../storage/store';
import { localDate } from '../domain/date';

const IDLE: SessionState = { status: 'idle', segmentIndex: 0, segment: null, segmentRemainingSec: 0 };

/** Plays `workout`; `onFinished(completed)` runs once when it ends (true only for a natural finish). */
export function useWorkoutSession(workout: Workout | null, onFinished: (completed: boolean) => void) {
  const coach = useMemo(() => createCoach(), []);
  const feedback = useMemo(() => createFeedback(), []);
  const beats = useMemo(() => createBeats(), []);
  const sessionRef = useRef<WorkoutSession | null>(null);
  const [state, setState] = useState<SessionState>(IDLE);
  // Background beats: on by default; mutable mid-workout and persisted.
  const [musicOn, setMusicOn] = useState<boolean>(() => getPrefs().music !== false);
  const finished = useEffectEvent(onFinished);

  // Reset while rendering when the workout changes, so a finished workout never
  // leaks its 'done' state into the next one (React's "adjust state when a prop
  // changes" pattern: remember the previous value in state, not a ref).
  const [shownWorkout, setShownWorkout] = useState(workout);
  if (shownWorkout !== workout) {
    setShownWorkout(workout);
    setState(IDLE);
  }

  useEffect(() => {
    if (!workout) return;
    let disposed = false; // put away (workout changed / unmounted): not a finish
    const clock = new RafClock();
    // Where to pick up after leaving: saved when each segment starts, and to the
    // second on pause (leaving the app pauses too). Not during the celebration.
    const remember = (s: SessionState) => {
      if (!s.segment || s.segment.kind === 'celebrate') return;
      saveCheckpoint({ workout, segmentIndex: s.segmentIndex, elapsedSec: s.segment.durationSec - s.segmentRemainingSec, date: localDate(new Date()) });
    };
    const session = new WorkoutSession(workout, clock, (e) => {
      if (disposed) return;
      if (e.type === 'tick') {
        setState(e.state);
      } else if (e.type === 'statusChanged') {
        setState(e.state);
        if (e.state.status === 'paused') remember(e.state);
      } else if (e.type === 'segmentChanged') {
        const s = session.getState();
        setState(s);
        remember(s);
      } else if (e.type === 'cue') {
        if (e.cue.say) { beats.duck(e.cue.say); coach.speak(e.cue.say); }
        if (e.cue.haptic) feedback.fire(e.cue.haptic);
      } else if (e.type === 'finished') {
        setState(session.getState());
        clearCheckpoint();
        beats.stop();
        void releaseWakeLock();
        finished(e.completed);
      }
    });
    sessionRef.current = session;
    return () => { disposed = true; session.end(); beats.stop(); void releaseWakeLock(); };
  }, [workout, coach, feedback, beats]);

  const start = useCallback((from?: { index: number; elapsedSec: number }) => {
    const v = getPrefs().voiceURI;
    if (v) coach.setVoiceURI(v);
    coach.prime();
    void requestWakeLock();
    beats.start();
    beats.setMuted(!musicOn);
    if (from) sessionRef.current?.startAt(from.index, from.elapsedSec);
    else sessionRef.current?.start();
  }, [coach, beats, musicOn]);
  const pause = useCallback(() => { sessionRef.current?.pause(); beats.stop(); }, [beats]);
  const resume = useCallback(() => {
    sessionRef.current?.resume();
    beats.start();
    beats.setMuted(!musicOn);
  }, [beats, musicOn]);
  // Leaving the app (screen locked, another app in front) pauses the workout, so
  // you come back to a Resume button instead of a coach who carried on without you.
  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') pause(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [pause]);
  const skip = useCallback(() => sessionRef.current?.skip(), []);
  const end = useCallback(() => {
    sessionRef.current?.end();
    beats.stop();
    void releaseWakeLock();
  }, [beats]);

  // Toggle the background beats live (and remember the choice). The side effects
  // stay out of the state updater, which React may run twice.
  const toggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    beats.setMuted(!next);
    if (next) beats.start(); // resume the scheduler if it was stopped
    setPrefs({ ...getPrefs(), music: next });
  }, [beats, musicOn]);

  return { state, start, pause, resume, skip, end, musicOn, toggleMusic, musicAvailable: beats.available };
}
