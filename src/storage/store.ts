import type { Equipment, Segment, SegmentKind, SoreArea, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';
import { computeStreak } from './streak';
import { ALL_EQUIPMENT } from '../domain/exercises';
import { MIN_LEVEL, MAX_LEVEL } from '../generator/effort';

export interface Completion {
  date: string;        // YYYY-MM-DD
  kind: string;
  focus: string;
  exerciseIds: string[];
  durationSec: number;
  sore?: SoreArea;     // the sore area chosen for this session (for next-day suggestion)
}

export interface Prefs {
  voiceURI?: string;
  equipment: Equipment[];
  style?: WorkoutStyle;
  music?: boolean;   // background beats during a workout (default on)
  level?: number;    // effort level from "How did that feel?" (generator/effort.ts)
}

export interface Checkpoint {
  workout: Workout;
  segmentIndex: number;
  elapsedSec: number;  // how far into that segment (to the second, when saved on pause)
  date: string;        // YYYY-MM-DD it was saved: only a same-day workout is offered for resume
}

/** An idea for the app, jotted down on the phone (kept here only — Share sends it on). */
export interface Idea {
  text: string;
  date: string;        // YYYY-MM-DD
}

export interface Store {
  version: 1;
  completions: Completion[];
  prefs: Prefs;
  checkpoint?: Checkpoint;
  recentThemes?: string[];
  ideas?: Idea[];
}

const KEY = 'mwe.store.v1';
const STYLES: readonly WorkoutStyle[] = ['circuit', 'stations'];
const SORE_AREAS: readonly SoreArea[] = ['none', 'shoulders', 'back', 'legs'];
const WORKOUT_KINDS: readonly WorkoutKind[] = ['10min', '20min', '30min', 'free'];
const SEGMENT_KINDS: readonly SegmentKind[] = ['intro', 'prepare', 'work', 'switch', 'rest', 'roundrest', 'celebrate'];

// --- Reading saved data -------------------------------------------------------
// Whatever is in localStorage may be corrupt, hand-edited, or written by an older
// version of the app, so it's checked field by field: anything that doesn't fit
// falls back to a default instead of crashing the app later.

type Fields = Record<string, unknown>;
const isRecord = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const isOneOf = <T extends string>(options: readonly T[], v: unknown): v is T =>
  options.some((o) => o === v);
const isDate = (v: unknown): v is string => isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

function isCompletion(v: unknown): v is Completion {
  return isRecord(v) && isDate(v.date)
    && isString(v.kind) && isString(v.focus) && isStringArray(v.exerciseIds) && isNumber(v.durationSec)
    && (v.sore === undefined || isOneOf(SORE_AREAS, v.sore));
}

const isIdea = (v: unknown): v is Idea => isRecord(v) && isString(v.text) && isDate(v.date);

function readPrefs(v: unknown): Prefs {
  const p = isRecord(v) ? v : {};
  const prefs: Prefs = {
    equipment: Array.isArray(p.equipment) && p.equipment.every((e) => isOneOf(ALL_EQUIPMENT, e))
      ? p.equipment : [...ALL_EQUIPMENT],
  };
  if (isString(p.voiceURI)) prefs.voiceURI = p.voiceURI;
  if (isOneOf(STYLES, p.style)) prefs.style = p.style;
  if (typeof p.music === 'boolean') prefs.music = p.music;
  if (isNumber(p.level) && Number.isInteger(p.level) && p.level >= MIN_LEVEL && p.level <= MAX_LEVEL) prefs.level = p.level;
  return prefs;
}

// Checks what the engine and the workout screens rely on.
function isSegment(v: unknown): v is Segment {
  if (!isRecord(v) || !isOneOf(SEGMENT_KINDS, v.kind) || !isNumber(v.durationSec) || v.durationSec <= 0) return false;
  if (!Array.isArray(v.cues) || !v.cues.every((c) => isRecord(c) && isNumber(c.atSec))) return false;
  if (v.reps !== undefined && !isNumber(v.reps)) return false;
  const ex = v.exercise;
  return ex === undefined || (isRecord(ex) && isString(ex.id) && isString(ex.name) && isString(ex.cue));
}

function isCheckpoint(v: unknown): v is Checkpoint {
  if (!isRecord(v) || !isRecord(v.workout)) return false;
  const w = v.workout;
  if (!isString(w.id) || !isOneOf(WORKOUT_KINDS, w.kind) || !isOneOf(STYLES, w.style) || !isNumber(w.rounds)) return false;
  if (w.level !== undefined && !isNumber(w.level)) return false;
  if (!Array.isArray(w.segments) || w.segments.length === 0 || !w.segments.every(isSegment)) return false;
  return isNumber(v.segmentIndex) && Number.isInteger(v.segmentIndex)
    && v.segmentIndex >= 0 && v.segmentIndex < w.segments.length
    && isNumber(v.elapsedSec) && v.elapsedSec >= 0 && isDate(v.date);
}

function readStore(v: unknown): Store {
  const s = isRecord(v) ? v : {};
  const store: Store = {
    version: 1,
    completions: Array.isArray(s.completions) ? s.completions.filter(isCompletion) : [],
    prefs: readPrefs(s.prefs),
  };
  if (isCheckpoint(s.checkpoint)) store.checkpoint = s.checkpoint;
  if (isStringArray(s.recentThemes)) store.recentThemes = s.recentThemes;
  if (Array.isArray(s.ideas)) store.ideas = s.ideas.filter(isIdea);
  return store;
}

export function loadStore(): Store {
  let saved: unknown = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw);
  } catch { /* storage blocked or unreadable: start from defaults */ }
  return readStore(saved);
}

function saveStore(s: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage full or blocked (e.g. some private-browsing modes). The workout
    // carries on; this one change just isn't remembered.
  }
}

export function recordCompletion(c: Completion): void {
  const s = loadStore();
  s.completions.push(c);
  saveStore(s);
}

export function getPrefs(): Prefs { return loadStore().prefs; }

export function setPrefs(p: Prefs): void {
  const s = loadStore();
  s.prefs = p;
  saveStore(s);
}

export function currentStreak(today: string): number {
  return computeStreak(loadStore().completions.map((c) => c.date), today);
}

// Suggest today's sore area from the last completed session: give whatever was
// emphasised last time a day to recover (alternate upper/lower). Manual choices
// of 'back'/'none' don't carry a clear complement, so they suggest 'none'.
const SORE_NEXT: Partial<Record<SoreArea, SoreArea>> = { shoulders: 'legs', legs: 'shoulders' };
export function suggestedSore(): SoreArea {
  const comps = loadStore().completions;
  const last = comps[comps.length - 1];
  return (last && last.sore && SORE_NEXT[last.sore]) || 'none';
}

export function saveCheckpoint(c: Checkpoint): void {
  const s = loadStore();
  s.checkpoint = c;
  saveStore(s);
}

/** Today's unfinished workout, if any. One left over from an earlier day isn't offered. */
export function getCheckpoint(today: string): Checkpoint | null {
  const cp = loadStore().checkpoint;
  return cp && cp.date === today ? cp : null;
}

export function clearCheckpoint(): void {
  const s = loadStore();
  delete s.checkpoint;
  saveStore(s);
}

export function getRecentThemes(): string[] {
  return loadStore().recentThemes ?? [];
}

export function pushRecentTheme(id: string, keep = 3): void {
  const s = loadStore();
  const list = (s.recentThemes ?? []).filter((t) => t !== id);
  list.push(id);
  s.recentThemes = list.slice(-keep);
  saveStore(s);
}

export function getIdeas(): Idea[] {
  return loadStore().ideas ?? [];
}

/** Saves an idea (newest last). Blank text is ignored. Returns the updated list. */
export function addIdea(text: string, date: string): Idea[] {
  const s = loadStore();
  const ideas = s.ideas ?? [];
  const trimmed = text.trim();
  if (trimmed) ideas.push({ text: trimmed, date });
  s.ideas = ideas;
  saveStore(s);
  return ideas;
}

/** Removes the idea at `index` (in saved order). Returns the updated list. */
export function removeIdea(index: number): Idea[] {
  const s = loadStore();
  const ideas = (s.ideas ?? []).filter((_, i) => i !== index);
  s.ideas = ideas;
  saveStore(s);
  return ideas;
}

/** The ideas as one plain-text list, ready to paste into a chat. */
export function ideasText(ideas: readonly Idea[]): string {
  const lines = ideas.map((i) => `- ${i.text.replace(/\s*\n\s*/g, ' ')} (${i.date})`);
  return ['Ideas for Move With Elli:', ...lines].join('\n');
}
