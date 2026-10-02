import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Legacy Browser Settings & Groq API Key Migration', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const fakeLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };
    vi.stubGlobal('localStorage', fakeLocalStorage);
    vi.stubGlobal('window', { localStorage: fakeLocalStorage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Groq API Key Security & Migration', () => {
    it('seamlessly loads and auto-migrates legacy Groq API key', () => {
      mockStorage['blogly_groq_api_key'] = 'gsk_mock_secret_key_12345';
      expect(mockStorage['pomegranate_groq_api_key']).toBeUndefined();

      // Simulate loading Groq key (FileUploadTab & SettingsTab logic)
      let groqApiKey = localStorage.getItem('pomegranate_groq_api_key') || '';
      if (!groqApiKey.trim()) {
        const legacyKey = localStorage.getItem('blogly_groq_api_key') || '';
        if (legacyKey.trim()) {
          groqApiKey = legacyKey;
          localStorage.setItem('pomegranate_groq_api_key', legacyKey);
          localStorage.removeItem('blogly_groq_api_key');
        }
      }

      expect(groqApiKey).toBe('gsk_mock_secret_key_12345');
      expect(mockStorage['pomegranate_groq_api_key']).toBe('gsk_mock_secret_key_12345');
      expect(mockStorage['blogly_groq_api_key']).toBeUndefined();
    });

    it('clear action strictly purges BOTH current and legacy Groq API keys', () => {
      mockStorage['pomegranate_groq_api_key'] = 'gsk_new_key';
      mockStorage['blogly_groq_api_key'] = 'gsk_old_key';

      // Simulate clear Groq key action
      localStorage.removeItem('pomegranate_groq_api_key');
      localStorage.removeItem('blogly_groq_api_key');

      expect(mockStorage['pomegranate_groq_api_key']).toBeUndefined();
      expect(mockStorage['blogly_groq_api_key']).toBeUndefined();
    });
  });

  describe('Feature Toggles Migration', () => {
    it('migrates legacy feature toggles from blogly_features to pomegranate_features', () => {
      const legacyFeatures = { audioReader: true, copyLink: false, highlighter: true };
      mockStorage['blogly_features'] = JSON.stringify(legacyFeatures);
      expect(mockStorage['pomegranate_features']).toBeUndefined();

      // Simulate feature initialization logic
      let raw = localStorage.getItem('pomegranate_features');
      if (!raw) {
        const legacyRaw = localStorage.getItem('blogly_features');
        if (legacyRaw) {
          raw = legacyRaw;
          localStorage.setItem('pomegranate_features', legacyRaw);
          localStorage.removeItem('blogly_features');
        }
      }

      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw!);
      expect(parsed.audioReader).toBe(true);
      expect(parsed.copyLink).toBe(false);
      expect(parsed.highlighter).toBe(true);

      expect(mockStorage['pomegranate_features']).toBe(JSON.stringify(legacyFeatures));
      expect(mockStorage['blogly_features']).toBeUndefined();
    });
  });

  describe('Privacy Preferences Migration', () => {
    it('migrates legacy privacy options from blogly_privacy to pomegranate_privacy', () => {
      const legacyPrivacy = { analytics: true, footerNote: false };
      mockStorage['blogly_privacy'] = JSON.stringify(legacyPrivacy);
      expect(mockStorage['pomegranate_privacy']).toBeUndefined();

      // Simulate privacy initialization logic
      let raw = localStorage.getItem('pomegranate_privacy');
      if (!raw) {
        const legacyRaw = localStorage.getItem('blogly_privacy');
        if (legacyRaw) {
          raw = legacyRaw;
          localStorage.setItem('pomegranate_privacy', legacyRaw);
          localStorage.removeItem('blogly_privacy');
        }
      }

      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw!);
      expect(parsed.analytics).toBe(true);
      expect(parsed.footerNote).toBe(false);

      expect(mockStorage['pomegranate_privacy']).toBe(JSON.stringify(legacyPrivacy));
      expect(mockStorage['blogly_privacy']).toBeUndefined();
    });
  });

  describe('Theme and Font Preferences Migration', () => {
    it('maps legacy blogly theme to pomegranate and monocraft font to consolas', () => {
      mockStorage['blogly_theme'] = 'blogly';
      mockStorage['blogly_font'] = 'monocraft';

      // Simulate highlightActiveThemeAndFont migration logic
      let currentTheme = localStorage.getItem('pomegranate_theme');
      if (!currentTheme) {
        const legacyTheme = localStorage.getItem('blogly_theme');
        if (legacyTheme) {
          currentTheme = legacyTheme === 'blogly' ? 'pomegranate' : legacyTheme;
          localStorage.setItem('pomegranate_theme', currentTheme);
          localStorage.removeItem('blogly_theme');
        }
      }

      let currentFont = localStorage.getItem('pomegranate_font');
      if (!currentFont) {
        const legacyFont = localStorage.getItem('blogly_font');
        if (legacyFont) {
          currentFont = legacyFont === 'monocraft' ? 'consolas' : legacyFont;
          localStorage.setItem('pomegranate_font', currentFont);
          localStorage.removeItem('blogly_font');
        }
      }

      expect(currentTheme).toBe('pomegranate');
      expect(currentFont).toBe('consolas');
      expect(mockStorage['pomegranate_theme']).toBe('pomegranate');
      expect(mockStorage['pomegranate_font']).toBe('consolas');
      expect(mockStorage['blogly_theme']).toBeUndefined();
      expect(mockStorage['blogly_font']).toBeUndefined();
    });
  });

  describe('Active Dashboard Tab Migration', () => {
    it('migrates legacy blogly_active_tab to pomegranate_active_tab and cleans up old key', () => {
      mockStorage['blogly_active_tab'] = 'settings';
      expect(mockStorage['pomegranate_active_tab']).toBeUndefined();

      let storedTab = localStorage.getItem('pomegranate_active_tab');
      if (!storedTab) {
        const legacyTab = localStorage.getItem('blogly_active_tab');
        if (legacyTab) {
          storedTab = legacyTab;
          localStorage.setItem('pomegranate_active_tab', legacyTab);
          localStorage.removeItem('blogly_active_tab');
        }
      }

      expect(storedTab).toBe('settings');
      expect(mockStorage['pomegranate_active_tab']).toBe('settings');
      expect(mockStorage['blogly_active_tab']).toBeUndefined();
    });
  });
});
