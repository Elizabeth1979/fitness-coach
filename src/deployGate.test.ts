import { describe, it, expect } from 'vitest';
import vercel from '../vercel.json';
import pkg from '../package.json';

// Vercel only promotes a deploy when its build command succeeds, so that
// command is the gate: lint (warnings included), the tests, then the type-checked build.

describe('deploy gate (vercel.json buildCommand)', () => {
  const steps = vercel.buildCommand.split('&&').map((s) => s.trim());

  it('lints, tests, then builds, and stops at the first failure', () => {
    expect(steps).toEqual(['npm run lint', 'npm run test:run', 'npm run build']);
  });

  it('treats lint warnings as failures', () => {
    expect(pkg.scripts.lint).toBe('oxlint --deny-warnings');
  });

  it('type-checks as part of the build', () => {
    expect(pkg.scripts.build).toMatch(/^tsc -b && /);
  });
});
