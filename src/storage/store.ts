import type { Equipment, Segment, SegmentKind, SoreArea, Workout, WorkoutKind, WorkoutStyle } from '../domain/types';
import { computeStreak } from './streak';

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
}

export interface Checkpoint {
  workout: Workout;
  segmentIndex: number;
  elapsedSec: number;
}

export interface Store {
  version: 1;
  completions: Completion[];
  prefs: Prefs;
  checkpoint?: Checkpoint;
  recentThemes?: string[];
}

const KEY = 'mwe.store.v1';
const EQUIPMENT: readonly Equipment[] = ['bodyweight', 'pullup_bar', 'weights', 'blocks_bands'];
const STYLES: readonly WorkoutStyle[] = ['circuit', 'stations'];
const SORE_AREAS: readonly SoreArea[] = ['none', 'shoulders', 'back', 'legs'];
const WORKOUT_KINDS: readonly WorkoutKind[] = ['10min', '20min', '30min', 'free'];
const SEGMENT_KINDS: readonly SegmentKind[] = ['prepare', 'work', 'switch', 'rest', 'roundrest', 'celebrate'];

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

function isCompletion(v: unknown): v is Completion {
  return isRecord(v) && isString(v.date) && /^\d{4}-\d{2}-\d{2}$/.test(v.date)
    && isString(v.kind) && isString(v.focus) && isStringArray(v.exerciseIds) && isNumber(v.durationSec)
    && (v.sore === undefined || isOneOf(SORE_AREAS, v.sore));
}

function readPrefs(v: unknown): Prefs {
  const p = isRecord(v) ? v : {};
  const prefs: Prefs = {
    equipment: Array.isArray(p.equipment) && p.equipment.every((e) => isOneOf(EQUIPMENT, e))
      ? p.equipment : [...EQUIPMENT],
  };
  if (isString(p.voiceURI)) prefs.voiceURI = p.voiceURI;
  if (isOneOf(STYLES, p.style)) prefs.style = p.style;
  if (typeof p.music === 'boolean') prefs.music = p.music;
  return prefs;
}

// Checks what the engine and the workout screens rely on.
function isSegment(v: unknown): v is Segment {
  if (!isRecord(v) || !isOneOf(SEGMENT_KINDS, v.kind) || !isNumber(v.durationSec) || v.durationSec <= 0) return false;
  if (!Array.isArray(v.cues) || !v.cues.every((c) => isRecord(c) && isNumber(c.atSec))) return false;
  const ex = v.exercise;
  return ex === undefined || (isRecord(ex) && isString(ex.id) && isString(ex.name) && isString(ex.cue));
}

function isCheckpoint(v: unknown): v is Checkpoint {
  if (!isRecord(v) || !isRecord(v.workout)) return false;
  const w = v.workout;
  if (!isString(w.id) || !isOneOf(WORKOUT_KINDS, w.kind) || !isOneOf(STYLES, w.style) || !isNumber(w.rounds)) return false;
  if (!Array.isArray(w.segments) || w.segments.length === 0 || !w.segments.every(isSegment)) return false;
  return isNumber(v.segmentIndex) && Number.isInteger(v.segmentIndex)
    && v.segmentIndex >= 0 && v.segmentIndex < w.segments.length
    && isNumber(v.elapsedSec) && v.elapsedSec >= 0;
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

export function getCheckpoint(): Checkpoint | null {
  return loadStore().checkpoint ?? null;
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
