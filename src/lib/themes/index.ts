import { themePacks } from './packs';
import type { ThemeId, ThemePack } from './types';

export * from './types';
export * from './schema';
export * from './packs';

export const DEFAULT_THEME_ID: ThemeId = 'pomegranate';

export function getTheme(id?: string | null): ThemePack {
  if (id === 'blogly') {
    return themePacks.pomegranate;
  }
  if (id && id in themePacks) {
    return themePacks[id as ThemeId];
  }
  return themePacks[DEFAULT_THEME_ID];
}

export function getAllThemes(): ThemePack[] {
  return Object.values(themePacks);
}
