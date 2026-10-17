// A deliberately slow estimate of the coach's speaking rate: the cue schedules are
// planned with it (and the cue-timing test checks them with it), so a line never runs late.
export const WORDS_PER_SEC = 2.5;

/** Roughly how long the coach takes to say `text`, in seconds. */
export const secsToSay = (text: string): number => text.split(/\s+/).filter(Boolean).length / WORDS_PER_SEC;
