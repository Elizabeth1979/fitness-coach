import { useEffect, useId, useState, type FormEvent } from 'react';
import { addIdea, getIdeas, removeIdea, type Idea } from '../storage/store';
import { sendPendingIdeas } from '../ideas/send';
import { localDate } from '../domain/date';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

/**
 * Jot down an idea for the app — mid-workout, on Home or after a workout. It's sent
 * straight to Claude's ideas list (ideas/send.ts); offline, it waits on the phone
 * and goes the next time the app is online.
 */
export function IdeasSheet({ onClose }: { onClose: () => void }) {
  const boxId = useId();
  const [ideas, setIdeas] = useState<Idea[]>(getIdeas);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  // Anything still waiting (saved offline, or before ideas were sent) goes now.
  useEffect(() => {
    let open = true;
    void sendPendingIdeas().then(() => { if (open) setIdeas(getIdeas()); });
    return () => { open = false; };
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setIdeas(addIdea(text, localDate(new Date())));
    setText('');
    setNote('Sending…');
    const waiting = await sendPendingIdeas();
    setIdeas(getIdeas());
    setNote(waiting > 0 ? "Saved. It'll send by itself when you're back online." : 'Sent — thank you!');
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
        <button type="submit" className="btn btn-primary btn-block idea-save" disabled={!text.trim()}>Send idea</button>
        <p className="hint field-note" role="status">{note}</p>
      </form>

      {ideas.length > 0 && (
        <ul className="idea-list" aria-label="Your ideas so far">
          {ideas.map((idea, i) => ({ idea, i })).reverse().map(({ idea, i }) => (
            <li key={idea.id ?? `${i}-${idea.text}`} className="idea-row">
              <div className="row-main">
                <div className="idea-text">{idea.text}</div>
                <div className="hint">{idea.date} · {idea.sent ? 'Sent' : 'Waiting to send'}</div>
              </div>
              {idea.sent
                ? <Icon name="check" size={20} className="icon-brand" />
                : (
                  // Only an idea that hasn't gone yet can be taken back.
                  <button className="btn btn-soft btn-close" onClick={() => setIdeas(removeIdea(i))} aria-label={`Delete idea: ${idea.text}`}>
                    <Icon name="trash" size={18} />
                  </button>
                )}
            </li>
          ))}
        </ul>
      )}
      <p className="hint field-note">Ideas go straight to Claude, privately, for the next update.</p>
    </Sheet>
  );
}
