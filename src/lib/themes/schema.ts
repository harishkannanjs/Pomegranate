import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color');

export const readTokensSchema = z.object({
  'bg-base': hexColor,
  'bg-surface': hexColor,
  'bg-surface-raised': hexColor,
  border: hexColor,
  'border-strong': hexColor,
  'text-primary': hexColor,
  'text-secondary': hexColor,
  'text-tertiary': hexColor,
  accent: hexColor,
});

export const chromeTokensSchema = z.object({
  'input-bg': hexColor,
  'input-border-focus': hexColor,
  'hover-bg': hexColor,
  danger: hexColor,
  success: hexColor,
  'secondary-accent': hexColor.optional(),
});

export const modeTokensSchema = z.object({
  read: readTokensSchema,
  chrome: chromeTokensSchema,
});

export const themePackSchema = z.object({
  id: z.enum([
    'blogly',
    'catppuccin',
    'gruvbox',
    'solarized',
    'tokyo-night',
    'nord',
    'dracula',
  ]),
  name: z.string().min(1),
  mode: z.enum(['tui', 'standard']),
  font: z.string().min(1),
  fontFamily: z.string().min(1),
  tokens: z.object({
    dark: modeTokensSchema,
    light: modeTokensSchema,
  }),
});

export type ValidatedThemePack = z.infer<typeof themePackSchema>;
