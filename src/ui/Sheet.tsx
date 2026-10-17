import { useEffect, useRef, type ReactNode } from 'react';
import { useTapGuard } from './useTapGuard';
import { useBackButton } from './useBackButton';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Props { label: string; onClose: () => void; children: ReactNode }

/**
 * A bottom sheet that behaves like a real dialog: focus moves into it when it opens,
 * Tab / Shift+Tab stay inside it, Escape, Back or a tap on the backdrop closes it,
 * and focus goes back to whatever opened it.
 */
export function Sheet({ label, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const guard = useTapGuard(); // the tap that opened it can't also hit what's inside
  useBackButton(true, onClose); // the phone's Back closes the sheet
  // Read the latest onClose from the key handler without re-running the effect (and re-focusing) on every render.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? dialog).focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog!.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !dialog!.contains(active))) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div className="sheet-backdrop" onClick={onClose} onClickCapture={guard}>
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
