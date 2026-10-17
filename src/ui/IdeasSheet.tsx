import { useId, useState, type FormEvent } from 'react';
import { addIdea, getIdeas, ideasText, removeIdea, type Idea } from '../storage/store';
import { localDate } from '../domain/date';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

const TITLE = 'Ideas for Move With Elli';

/**
 * Jot down an idea for the app — mid-workout, on Home or after a workout. Ideas stay
 * on this phone; Share (or Copy, where the phone has no share menu) hands the list on,
 * e.g. into a chat with Claude when planning the next update.
 */
export function IdeasSheet({ onClose }: { onClose: () => void }) {
  const boxId = useId();
  const [ideas, setIdeas] = useState<Idea[]>(getIdeas);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [manual, setManual] = useState<string | null>(null); // copy was blocked: show the text to copy by hand
  const canShare = typeof navigator.share === 'function';

  function save(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIdeas(addIdea(text, localDate(new Date())));
    setManual(null); // the hand-copy text would be out of date
    setText('');
    setNote('Saved.');
  }

  async function share() {
    const all = ideasText(ideas);
    if (canShare) {
      try { await navigator.share({ title: TITLE, text: all }); return; }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return; // closed the share menu
        // Share failed for another reason: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(all);
      setNote('Copied — paste them into your chat with Claude.');
    } catch {
      setManual(all);
      setNote("Couldn't copy automatically — select the text below and copy it.");
    }
  }

  return (
    <Sheet label="Your ideas" onClose={onClose}>
      <div className="row-between sheet-head">
        <h2 className="t-section">Your ideas</h2>
        <button className="btn btn-soft btn-close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={20} />
        </button>
      </div>

      <form className="field" onSubmit={save}>
        <label className="eyebrow" htmlFor={boxId}>What would make the app better?</label>
        <textarea id={boxId} data-autofocus className="textarea" rows={3} maxLength={1000}
          value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-block idea-save" disabled={!text.trim()}>Save idea</button>
        <p className="hint field-note" role="status">{note}</p>
      </form>

      {ideas.length > 0 && (
        <>
          <ul className="idea-list" aria-label="Saved ideas">
            {ideas.map((idea, i) => ({ idea, i })).reverse().map(({ idea, i }) => (
              <li key={`${i}-${idea.date}-${idea.text}`} className="idea-row">
                <div className="row-main">
                  <div className="idea-text">{idea.text}</div>
                  <div className="hint">{idea.date}</div>
                </div>
                <button className="btn btn-soft btn-close" onClick={() => { setIdeas(removeIdea(i)); setManual(null); }} aria-label={`Delete idea: ${idea.text}`}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            ))}
          </ul>
          <button className="btn btn-soft btn-block" onClick={share}>
            <Icon name={canShare ? 'share' : 'copy'} />{canShare ? 'Share ideas' : 'Copy ideas'}
          </button>
          {manual !== null && (
            <textarea className="textarea idea-manual" readOnly rows={5} value={manual} aria-label="Your ideas as text"
              onFocus={(e) => e.currentTarget.select()} />
          )}
        </>
      )}
      <p className="hint field-note">Kept on this phone only. Share them with Claude when you plan the next update.</p>
    </Sheet>
  );
}
