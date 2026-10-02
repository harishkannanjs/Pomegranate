import { describe, it, expect } from 'vitest';
import { themePacks, getTheme, getAllThemes, DEFAULT_THEME_ID } from '../src/lib/themes';
import { themePackSchema } from '../src/lib/themes/schema';

describe('Theme Pack Architecture', () => {
  it('has all 7 theme packs defined', () => {
    const themes = getAllThemes();
    expect(themes).toHaveLength(7);
    const ids = themes.map((t) => t.id).sort();
    expect(ids).toEqual([
      'catppuccin',
      'dracula',
      'gruvbox',
      'nord',
      'pomegranate',
      'solarized',
      'tokyo-night',
    ]);
  });

  it('validates all 7 theme packs against Zod schema', () => {
    for (const theme of getAllThemes()) {
      const parsed = themePackSchema.safeParse(theme);
      expect(
        parsed.success,
        `Theme ${theme.id} failed validation: ${!parsed.success ? JSON.stringify(parsed.error) : ''}`
      ).toBe(true);
    }
  });

  it('correctly sets TUI mode for Pomegranate and Standard mode for community themes', () => {
    expect(themePacks.pomegranate.mode).toBe('tui');
    expect(themePacks.catppuccin.mode).toBe('standard');
    expect(themePacks.gruvbox.mode).toBe('standard');
    expect(themePacks.solarized.mode).toBe('standard');
    expect(themePacks['tokyo-night'].mode).toBe('standard');
    expect(themePacks.nord.mode).toBe('standard');
    expect(themePacks.dracula.mode).toBe('standard');
  });

  it('assigns exact fonts per theme specification', () => {
    expect(themePacks.pomegranate.font).toBe('Consolas');
    expect(themePacks.catppuccin.font).toBe('JetBrains Mono');
    expect(themePacks.gruvbox.font).toBe('IBM Plex Mono');
    expect(themePacks.solarized.font).toBe('Source Code Pro');
    expect(themePacks['tokyo-night'].font).toBe('Cascadia Code');
    expect(themePacks.nord.font).toBe('JetBrains Mono');
    expect(themePacks.dracula.font).toBe('Fira Code');
  });

  it('has exact hex values for dark and light modes matching specs', () => {
    // Pomegranate check
    expect(themePacks.pomegranate.tokens.dark.read['text-primary']).toBe('#B59D9F');
    expect(themePacks.pomegranate.tokens.light.read['text-primary']).toBe('#210F13');
    expect(themePacks.pomegranate.tokens.dark.read['accent-fill']).toBe('#991E34');
    expect(themePacks.pomegranate.tokens.light.read['accent-fill']).toBe('#991E34');
    expect(themePacks.pomegranate.tokens.dark.read['text-secondary']).toBe('#B59D9FBF');
    expect(themePacks.pomegranate.tokens.dark.read['text-tertiary']).toBe('#B59D9F80');

    // All themes have accent-fill defined
    for (const theme of getAllThemes()) {
      expect(theme.tokens.dark.read['accent-fill']).toBeDefined();
      expect(theme.tokens.light.read['accent-fill']).toBeDefined();
    }

    // Catppuccin check
    expect(themePacks.catppuccin.tokens.dark.read['bg-base']).toBe('#1e1e2e');
    expect(themePacks.catppuccin.tokens.light.read['bg-base']).toBe('#eff1f5');

    // Gruvbox check
    expect(themePacks.gruvbox.tokens.dark.read['bg-base']).toBe('#282828');
    expect(themePacks.gruvbox.tokens.dark.read.accent).toBe('#d79921');
    expect(themePacks.gruvbox.tokens.light.read['bg-base']).toBe('#fbf1c7');

    // Solarized check
    expect(themePacks.solarized.tokens.dark.read['bg-base']).toBe('#002b36');
    expect(themePacks.solarized.tokens.light.read['bg-base']).toBe('#fdf6e3');
    expect(themePacks.solarized.tokens.dark.read.accent).toBe('#268bd2');
    expect(themePacks.solarized.tokens.light.read.accent).toBe('#268bd2'); // Identical accent both modes

    // Tokyo Night check
    expect(themePacks['tokyo-night'].tokens.dark.read['bg-base']).toBe('#1a1b26');
    expect(themePacks['tokyo-night'].tokens.dark.chrome['secondary-accent']).toBe('#7dcfff');

    // Nord check
    expect(themePacks.nord.tokens.dark.read['bg-base']).toBe('#2e3440');
    expect(themePacks.nord.tokens.light.read['bg-base']).toBe('#eceff4');

    // Dracula check
    expect(themePacks.dracula.tokens.dark.read['bg-base']).toBe('#282a36');
    expect(themePacks.dracula.tokens.dark.chrome['secondary-accent']).toBe('#ff79c6');
    expect(themePacks.dracula.tokens.light.chrome['secondary-accent']).toBe('#c23f8f');
  });

  it('getTheme helper retrieves theme or falls back to default', () => {
    expect(getTheme('dracula').id).toBe('dracula');
    expect(getTheme('blogly').id).toBe('pomegranate');
    expect(getTheme('non-existent').id).toBe(DEFAULT_THEME_ID);
    expect(getTheme(null).id).toBe(DEFAULT_THEME_ID);
  });
});
