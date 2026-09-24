import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// The only test that loads the real firebase.js, with the SDK underneath it
// stubbed: everything else mocks the whole module, so nothing else would notice
// App Check quietly failing to register.
const initializeAppCheck = vi.fn();

class ReCaptchaV3Provider {
  constructor(siteKey) {
    this.siteKey = siteKey;
  }
}

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ name: 'test-app' })) }));
vi.mock('firebase/database', () => ({ getDatabase: vi.fn(() => ({})) }));
vi.mock('firebase/ai', () => ({ getAI: vi.fn(() => ({})), GoogleAIBackend: class {} }));
vi.mock('firebase/app-check', () => ({ initializeAppCheck, ReCaptchaV3Provider }));

beforeEach(() => {
  vi.resetModules();
  initializeAppCheck.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('App Check', () => {
  test('is registered with the configured reCAPTCHA site key', async () => {
    vi.stubEnv('VITE_APPCHECK_SITE_KEY', 'site-key-123');

    await import('./firebase');

    expect(initializeAppCheck).toHaveBeenCalledTimes(1);
    const [, options] = initializeAppCheck.mock.calls[0];
    expect(options.provider.siteKey).toBe('site-key-123');
    expect(options.isTokenAutoRefreshEnabled).toBe(true);
  });

  test('is skipped when no site key is configured, so the games still run', async () => {
    vi.stubEnv('VITE_APPCHECK_SITE_KEY', '');

    const { database, ai } = await import('./firebase');

    expect(initializeAppCheck).not.toHaveBeenCalled();
    expect(database).toBeTruthy();
    expect(ai).toBeTruthy();
  });
});
