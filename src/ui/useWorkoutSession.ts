import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function useWorkoutSession(workout: Workout | null) {
  const coach = useMemo(() => createCoach(), []);
  const feedback = useMemo(() => createFeedback(), []);
  const beats = useMemo(() => createBeats(), []);
  const sessionRef = useRef<WorkoutSession | null>(null);
  const [state, setState] = useState<SessionState>(IDLE);
  const [completed, setCompleted] = useState(false);
  // Background beats: on by default; mutable mid-workout and persisted.
  const [musicOn, setMusicOn] = useState<boolean>(() => getPrefs().music !== false);
  const musicOnRef = useRef(musicOn);
  musicOnRef.current = musicOn;

  // Reset synchronously when the workout changes, so a finished workout never
  // leaks its 'done'/'completed' state into the next one (the finish effect in
  // App keys on state.status === 'done').
  const prevWorkout = useRef<Workout | null>(workout);
  if (prevWorkout.current !== workout) {
    prevWorkout.current = workout;
    setState(IDLE);
    setCompleted(false);
  }

  useEffect(() => {
    if (!workout) return;
    setCompleted(false);
    const clock = new RafClock();
    // Where to pick up after leaving: saved when each segment starts, and to the
    // second on pause (leaving the app pauses too). Not during the celebration.
    const remember = (s: SessionState) => {
      if (!s.segment || s.segment.kind === 'celebrate') return;
      saveCheckpoint({ workout, segmentIndex: s.segmentIndex, elapsedSec: s.segment.durationSec - s.segmentRemainingSec, date: localDate(new Date()) });
    };
    const session = new WorkoutSession(workout, clock, (e) => {
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
        setCompleted(e.completed);
        clearCheckpoint();
        beats.stop();
        void releaseWakeLock();
      }
    });
    sessionRef.current = session;
    setState(session.getState());
    return () => { session.end(); beats.stop(); void releaseWakeLock(); };
  }, [workout, coach, feedback, beats]);

  const start = useCallback((from?: { index: number; elapsedSec: number }) => {
    const v = getPrefs().voiceURI;
    if (v) coach.setVoiceURI(v);
    coach.prime();
    void requestWakeLock();
    beats.start();
    beats.setMuted(!musicOnRef.current);
    if (from) sessionRef.current?.startAt(from.index, from.elapsedSec);
    else sessionRef.current?.start();
  }, [coach, beats]);
  const pause = useCallback(() => { sessionRef.current?.pause(); beats.stop(); }, [beats]);
  const resume = useCallback(() => {
    sessionRef.current?.resume();
    beats.start();
    beats.setMuted(!musicOnRef.current);
  }, [beats]);
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

  // Toggle the background beats live (and remember the choice).
  const toggleMusic = useCallback(() => {
    setMusicOn((on) => {
      const next = !on;
      beats.setMuted(!next);
      if (next) beats.start(); // resume the scheduler if it was stopped
      setPrefs({ ...getPrefs(), music: next });
      return next;
    });
  }, [beats]);

  return { state, completed, start, pause, resume, skip, end, musicOn, toggleMusic, musicAvailable: beats.available };
}
