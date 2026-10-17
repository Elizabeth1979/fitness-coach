import { markIdeaSent, unsentIdeas, type Idea } from '../storage/store';

// Ideas from the "Your ideas" sheet go to a small Supabase database (project
// "move-with-elli") that Claude reads when planning the next update. Its rules let
// this public key ADD ideas only — nobody can read them back through it. The key
// is a publishable key, made to sit in app code (it's in the bundle either way).
const SUPABASE_URL = 'https://idaningbbhqjerlfsmuz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cPVYYMxpwrT96ncGMcJ_gw_muZfR4Ue';
const DUPLICATE = '23505'; // already there from an earlier try

/** Sends one idea; true once the database has it. */
export type SendIdea = (idea: Required<Pick<Idea, 'id' | 'text' | 'date'>>) => Promise<boolean>;

const sendToSupabase: SendIdea = async (idea) => {
  // Loaded only when there's something to send, so the workout itself never waits on it.
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.from('ideas').insert({ client_id: idea.id, body: idea.text, noted_on: idea.date });
  return !error || error.code === DUPLICATE;
};

/**
 * Sends every idea that hasn't gone yet. Safe to call any time (on open, after
 * saving, back online): calls take turns, so each sees what the last one sent,
 * and each idea has an id, so even a repeat can't make a copy.
 * Returns how many are still waiting (e.g. offline).
 */
export function sendPendingIdeas(send: SendIdea = sendToSupabase): Promise<number> {
  turn = turn.then(() => sendNow(send));
  return turn;
}
let turn: Promise<number> = Promise.resolve(0);

async function sendNow(send: SendIdea): Promise<number> {
  let waiting = 0;
  for (const idea of unsentIdeas()) {
    let ok = false;
    try { ok = await send(idea); } catch { /* offline or the server is down: try again later */ }
    if (ok) markIdeaSent(idea.id); else waiting++;
  }
  return waiting;
}
