import type { ThemePack, ThemeId } from './types';

export const bloglyTheme: ThemePack = {
  id: 'blogly',
  name: 'Blogly',
  mode: 'tui',
  font: 'Monocraft',
  fontFamily: "'Monocraft', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#070a14',
        'bg-surface': '#0d1224',
        'bg-surface-raised': '#131a33',
        border: '#232b4d',
        'border-strong': '#34406e',
        'text-primary': '#d7dbf0',
        'text-secondary': '#8891bb',
        'text-tertiary': '#565f8c',
        accent: '#4d8dff',
      },
      chrome: {
        'input-bg': '#0d1224',
        'input-border-focus': '#4d8dff',
        'hover-bg': '#131a33',
        danger: '#f2555a',
        success: '#3ddc84',
      },
    },
    light: {
      read: {
        'bg-base': '#f6f7fb',
        'bg-surface': '#ffffff',
        'bg-surface-raised': '#eceffa',
        border: '#d7dceb',
        'border-strong': '#b3bcdb',
        'text-primary': '#10142a',
        'text-secondary': '#4b5170',
        'text-tertiary': '#767c9c',
        accent: '#2955d9',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#2955d9',
        'hover-bg': '#eceffa',
        danger: '#c0342f',
        success: '#1f9d5c',
      },
    },
  },
};

export const catppuccinTheme: ThemePack = {
  id: 'catppuccin',
  name: 'Catppuccin',
  mode: 'standard',
  font: 'JetBrains Mono',
  fontFamily: "'JetBrains Mono', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#1e1e2e',
        'bg-surface': '#181825',
        'bg-surface-raised': '#313244',
        border: '#45475a',
        'border-strong': '#585b70',
        'text-primary': '#cdd6f4',
        'text-secondary': '#a6adc8',
        'text-tertiary': '#6c7086',
        accent: '#89b4fa',
      },
      chrome: {
        'input-bg': '#181825',
        'input-border-focus': '#89b4fa',
        'hover-bg': '#313244',
        danger: '#f38ba8',
        success: '#a6e3a1',
      },
    },
    light: {
      read: {
        'bg-base': '#eff1f5',
        'bg-surface': '#ffffff',
        'bg-surface-raised': '#e6e9ef',
        border: '#ccd0da',
        'border-strong': '#bcc0cc',
        'text-primary': '#4c4f69',
        'text-secondary': '#6c6f85',
        'text-tertiary': '#8c8fa1',
        accent: '#1e66f5',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#1e66f5',
        'hover-bg': '#e6e9ef',
        danger: '#d20f39',
        success: '#40a02b',
      },
    },
  },
};

export const gruvboxTheme: ThemePack = {
  id: 'gruvbox',
  name: 'Gruvbox',
  mode: 'standard',
  font: 'IBM Plex Mono',
  fontFamily: "'IBM Plex Mono', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#282828',
        'bg-surface': '#1d2021',
        'bg-surface-raised': '#3c3836',
        border: '#504945',
        'border-strong': '#665c54',
        'text-primary': '#ebdbb2',
        'text-secondary': '#bdae93',
        'text-tertiary': '#928374',
        accent: '#d79921',
      },
      chrome: {
        'input-bg': '#1d2021',
        'input-border-focus': '#d79921',
        'hover-bg': '#3c3836',
        danger: '#cc241d',
        success: '#98971a',
      },
    },
    light: {
      read: {
        'bg-base': '#fbf1c7',
        'bg-surface': '#f9f5d7',
        'bg-surface-raised': '#ebdbb2',
        border: '#d5c4a1',
        'border-strong': '#bdae93',
        'text-primary': '#3c3836',
        'text-secondary': '#665c54',
        'text-tertiary': '#7c6f64',
        accent: '#af3a03',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#af3a03',
        'hover-bg': '#ebdbb2',
        danger: '#9d0006',
        success: '#79740e',
      },
    },
  },
};

export const solarizedTheme: ThemePack = {
  id: 'solarized',
  name: 'Solarized',
  mode: 'standard',
  font: 'Source Code Pro',
  fontFamily: "'Source Code Pro', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#002b36',
        'bg-surface': '#073642',
        'bg-surface-raised': '#0a4a5a',
        border: '#586e75',
        'border-strong': '#657b83',
        'text-primary': '#93a1a1',
        'text-secondary': '#839496',
        'text-tertiary': '#586e75',
        accent: '#268bd2',
      },
      chrome: {
        'input-bg': '#073642',
        'input-border-focus': '#268bd2',
        'hover-bg': '#0a4a5a',
        danger: '#dc322f',
        success: '#859900',
      },
    },
    light: {
      read: {
        'bg-base': '#fdf6e3',
        'bg-surface': '#eee8d5',
        'bg-surface-raised': '#e4ddc4',
        border: '#93a1a1',
        'border-strong': '#839496',
        'text-primary': '#586e75',
        'text-secondary': '#657b83',
        'text-tertiary': '#93a1a1',
        accent: '#268bd2',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#268bd2',
        'hover-bg': '#e4ddc4',
        danger: '#dc322f',
        success: '#859900',
      },
    },
  },
};

export const tokyoNightTheme: ThemePack = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  mode: 'standard',
  font: 'Cascadia Code',
  fontFamily: "'Cascadia Code', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#1a1b26',
        'bg-surface': '#16161e',
        'bg-surface-raised': '#292e42',
        border: '#292e42',
        'border-strong': '#3b4261',
        'text-primary': '#c0caf5',
        'text-secondary': '#a9b1d6',
        'text-tertiary': '#565f89',
        accent: '#7aa2f7',
      },
      chrome: {
        'input-bg': '#16161e',
        'input-border-focus': '#7aa2f7',
        'hover-bg': '#292e42',
        danger: '#f7768e',
        success: '#9ece6a',
        'secondary-accent': '#7dcfff',
      },
    },
    light: {
      read: {
        'bg-base': '#e1e2e7',
        'bg-surface': '#f7f7fb',
        'bg-surface-raised': '#d3d4db',
        border: '#9699a3',
        'border-strong': '#6c6e75',
        'text-primary': '#3760bf',
        'text-secondary': '#5a4a78',
        'text-tertiary': '#848cb5',
        accent: '#2e7de9',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#2e7de9',
        'hover-bg': '#d3d4db',
        danger: '#f52a65',
        success: '#587539',
        'secondary-accent': '#00719c',
      },
    },
  },
};

export const nordTheme: ThemePack = {
  id: 'nord',
  name: 'Nord',
  mode: 'standard',
  font: 'JetBrains Mono',
  fontFamily: "'JetBrains Mono', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#2e3440',
        'bg-surface': '#242933',
        'bg-surface-raised': '#3b4252',
        border: '#434c5e',
        'border-strong': '#4c566a',
        'text-primary': '#eceff4',
        'text-secondary': '#d8dee9',
        'text-tertiary': '#4c566a',
        accent: '#88c0d0',
      },
      chrome: {
        'input-bg': '#242933',
        'input-border-focus': '#88c0d0',
        'hover-bg': '#3b4252',
        danger: '#bf616a',
        success: '#a3be8c',
      },
    },
    light: {
      read: {
        'bg-base': '#eceff4',
        'bg-surface': '#ffffff',
        'bg-surface-raised': '#e5e9f0',
        border: '#d8dee9',
        'border-strong': '#b8c2d6',
        'text-primary': '#2e3440',
        'text-secondary': '#4c566a',
        'text-tertiary': '#7b88a1',
        accent: '#5e81ac',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#5e81ac',
        'hover-bg': '#e5e9f0',
        danger: '#b64752',
        success: '#7a9a5e',
      },
    },
  },
};

export const draculaTheme: ThemePack = {
  id: 'dracula',
  name: 'Dracula',
  mode: 'standard',
  font: 'Fira Code',
  fontFamily: "'Fira Code', monospace",
  tokens: {
    dark: {
      read: {
        'bg-base': '#282a36',
        'bg-surface': '#21222c',
        'bg-surface-raised': '#44475a',
        border: '#44475a',
        'border-strong': '#6272a4',
        'text-primary': '#f8f8f2',
        'text-secondary': '#6272a4',
        'text-tertiary': '#4d5273',
        accent: '#bd93f9',
      },
      chrome: {
        'input-bg': '#21222c',
        'input-border-focus': '#bd93f9',
        'hover-bg': '#44475a',
        danger: '#ff5555',
        success: '#50fa7b',
        'secondary-accent': '#ff79c6',
      },
    },
    light: {
      read: {
        'bg-base': '#f6f5fa',
        'bg-surface': '#ffffff',
        'bg-surface-raised': '#ececf5',
        border: '#d7d5e6',
        'border-strong': '#b7b3d6',
        'text-primary': '#282a36',
        'text-secondary': '#4d4f6b',
        'text-tertiary': '#7b7d9e',
        accent: '#7841c9',
      },
      chrome: {
        'input-bg': '#ffffff',
        'input-border-focus': '#7841c9',
        'hover-bg': '#ececf5',
        danger: '#c9302c',
        success: '#1c9c4a',
        'secondary-accent': '#c23f8f',
      },
    },
  },
};

export const themePacks: Record<ThemeId, ThemePack> = {
  blogly: bloglyTheme,
  catppuccin: catppuccinTheme,
  gruvbox: gruvboxTheme,
  solarized: solarizedTheme,
  'tokyo-night': tokyoNightTheme,
  nord: nordTheme,
  dracula: draculaTheme,
};
