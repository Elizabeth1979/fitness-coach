import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Workout } from '../domain/types';
import { WorkoutSession, type SessionState } from '../engine/session';
import { RafClock } from '../engine/clock';
import { createCoach } from '../coach/coach';
import { createFeedback } from '../feedback/feedback';
import { requestWakeLock, releaseWakeLock } from '../pwa/wakeLock';

const IDLE: SessionState = { status: 'idle', segmentIndex: 0, segment: null, segmentRemainingSec: 0 };

export function useWorkoutSession(workout: Workout | null) {
  const coach = useMemo(() => createCoach(), []);
  const feedback = useMemo(() => createFeedback(), []);
  const sessionRef = useRef<WorkoutSession | null>(null);
  const [state, setState] = useState<SessionState>(IDLE);

  useEffect(() => {
    if (!workout) return;
    const clock = new RafClock();
    const session = new WorkoutSession(workout, clock, (e) => {
      if (e.type === 'tick' || e.type === 'segmentChanged') {
        setState(session.getState());
      } else if (e.type === 'cue') {
        if (e.cue.say) coach.speak(e.cue.say);
        if (e.cue.haptic) feedback.fire(e.cue.haptic);
      } else if (e.type === 'finished') {
        setState(session.getState());
        void releaseWakeLock();
      }
    });
    sessionRef.current = session;
    setState(session.getState());
    return () => { session.end(); void releaseWakeLock(); };
  }, [workout, coach, feedback]);

  const start = useCallback(() => {
    coach.prime();
    void requestWakeLock();
    sessionRef.current?.start();
  }, [coach]);
  const pause = useCallback(() => sessionRef.current?.pause(), []);
  const resume = useCallback(() => sessionRef.current?.resume(), []);
  const skip = useCallback(() => sessionRef.current?.skip(), []);
  const end = useCallback(() => {
    sessionRef.current?.end();
    void releaseWakeLock();
  }, []);

  return { state, start, pause, resume, skip, end };
}
