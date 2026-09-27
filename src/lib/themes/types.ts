export type ThemeId =
  | 'blogly'
  | 'catppuccin'
  | 'gruvbox'
  | 'solarized'
  | 'tokyo-night'
  | 'nord'
  | 'dracula';

export type ThemeMode = 'tui' | 'standard';

export type ColorMode = 'dark' | 'light';

export interface ReadTokens {
  'bg-base': string;
  'bg-surface': string;
  'bg-surface-raised': string;
  border: string;
  'border-strong': string;
  'text-primary': string;
  'text-secondary': string;
  'text-tertiary': string;
  accent: string;
}

export interface ChromeTokens {
  'input-bg': string;
  'input-border-focus': string;
  'hover-bg': string;
  danger: string;
  success: string;
  'secondary-accent'?: string;
}

export interface ModeTokens {
  read: ReadTokens;
  chrome: ChromeTokens;
}

export interface ThemePack {
  id: ThemeId;
  name: string;
  mode: ThemeMode;
  font: string;
  fontFamily: string;
  tokens: {
    dark: ModeTokens;
    light: ModeTokens;
  };
}
