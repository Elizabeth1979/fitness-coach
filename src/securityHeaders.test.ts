import { describe, it, expect } from 'vitest';
import vercel from '../vercel.json';

// Guards the security headers Vercel sends with every response (vercel.json).
// The app loads nothing from other origins, so the policy can stay strict.

const allRoutes = vercel.headers.find((h) => h.source === '/(.*)');
const header = (name: string): string | undefined =>
  allRoutes?.headers.find((h) => h.key.toLowerCase() === name.toLowerCase())?.value;

function directives(csp: string): Map<string, string[]> {
  return new Map(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [name, ...values] = d.split(/\s+/);
    return [name, values];
  }));
}

describe('security headers (vercel.json)', () => {
  it('apply to every route', () => {
    expect(allRoutes).toBeDefined();
  });

  describe('Content-Security-Policy', () => {
    const csp = directives(header('Content-Security-Policy') ?? '');

    it('only allows this origin by default', () => {
      expect(csp.get('default-src')).toEqual(["'self'"]);
    });

    it('sets the directives that do not fall back to default-src', () => {
      expect(csp.get('base-uri')).toEqual(["'none'"]);
      expect(csp.get('form-action')).toEqual(["'none'"]);
      expect(csp.get('frame-ancestors')).toEqual(["'none'"]);
    });

    it('blocks plugins', () => {
      expect(csp.get('object-src')).toEqual(["'none'"]);
    });

    it('never allows inline or eval-ed code, or any origin', () => {
      const all = [...csp.values()].flat();
      expect(all).not.toContain("'unsafe-inline'");
      expect(all).not.toContain("'unsafe-eval'");
      expect(all).not.toContain('*');
    });
  });

  it('stops MIME sniffing', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sends no referrer', () => {
    expect(header('Referrer-Policy')).toBe('no-referrer');
  });

  it('isolates the window from pages that open it', () => {
    expect(header('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('turns off device features the app never uses, but not the screen wake lock', () => {
    const policy = header('Permissions-Policy') ?? '';
    for (const feature of ['camera', 'microphone', 'geolocation']) {
      expect(policy).toContain(`${feature}=()`);
    }
    expect(policy).not.toContain('screen-wake-lock');
  });
});
