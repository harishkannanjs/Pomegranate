import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect } from 'vitest';
import { getCollection, render } from 'astro:content';
import BaseLayout from '../src/layouts/BaseLayout.astro';
import BlogPostLayout from '../src/layouts/BlogPostLayout.astro';
import { getAllThemes, type ColorMode } from '../src/lib/themes';
import Button from '../src/components/chrome/Button.astro';
import Toggle from '../src/components/chrome/Toggle.astro';
import Checkbox from '../src/components/chrome/Checkbox.astro';
import Panel from '../src/components/chrome/Panel.astro';
import TabBar from '../src/components/chrome/TabBar.astro';
import Input from '../src/components/chrome/Input.astro';
import LoadingIndicator from '../src/components/chrome/LoadingIndicator.astro';

describe('Theme Switching Regression Tests (14 States)', () => {
  const themes = getAllThemes();
  const modes: ColorMode[] = ['dark', 'light'];

  for (const theme of themes) {
    for (const mode of modes) {
      it(`renders BaseLayout for theme "${theme.id}" in "${mode}" mode without error`, async () => {
        const container = await AstroContainer.create();
        const html = await container.renderToString(BaseLayout, {
          props: {
            title: `Testing ${theme.name} - ${mode}`,
            theme: theme.id,
            mode: mode,
          },
          slots: {
            default: '<div id="content">Theme Content</div>',
          },
        });

        expect(html).toBeDefined();
        expect(html).toContain(`data-theme="${theme.id}"`);
        expect(html).toContain(`data-mode="${mode}"`);
        expect(html).toContain(mode === 'light' ? 'class="light"' : 'class="dark"');
        expect(html).toContain('Theme Content');
      });
    }
  }

  it('renders BlogPostLayout under active theme and mode without throwing', async () => {
    const posts = await getCollection('blog');
    const targetPost = posts.find((p) => p.id.includes('welcome-to-glyph')) || posts[0];
    expect(targetPost).toBeDefined();

    const { headings } = await render(targetPost!);
    const container = await AstroContainer.create();

    for (const theme of themes) {
      const html = await container.renderToString(BlogPostLayout, {
        props: {
          post: targetPost!,
          allPosts: posts,
          headings: headings || [],
          theme: theme.id,
        },
        slots: {
          default: '<p>Blog article body</p>',
        },
      });

      expect(html).toBeDefined();
      expect(html).toContain(targetPost!.data.title);
      expect(html).toContain('Blog article body');
    }
  });

  describe('Mode-Aware Chrome Components Rendering', () => {
    it('renders Button with TUI bracketed and Standard rounded sub-templates', async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(Button, {
        props: { variant: 'primary', shortcut: '^S' },
        slots: { default: 'Save' },
      });

      expect(html).toContain('chrome-tui-inline');
      expect(html).toContain('chrome-std-inline');
      expect(html).toContain('Save');
      expect(html).toContain('^S');
    });

    it('renders Toggle with TUI [ Y ]/[ N ] and Standard sliding pill sub-templates', async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(Toggle, {
        props: { label: 'Enable Feature', checked: true },
      });

      expect(html).toContain('chrome-tui-inline');
      expect(html).toContain('[ Y ]');
      expect(html).toContain('[ N ]');
      expect(html).toContain('chrome-std-inline');
      expect(html).toContain('Enable Feature');
    });

    it('renders Checkbox and Radio controls', async () => {
      const container = await AstroContainer.create();
      const checkHtml = await container.renderToString(Checkbox, {
        props: { label: 'Multi select', checked: true },
      });
      expect(checkHtml).toContain('[x]');
      expect(checkHtml).toContain('[ ]');

      const radioHtml = await container.renderToString(Checkbox, {
        props: { label: 'Single select', radio: true, checked: true },
      });
      expect(radioHtml).toContain('(•)');
      expect(radioHtml).toContain('( )');
    });

    it('renders Panel with TUI titled-border and Standard rounded card sub-templates', async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(Panel, {
        props: { title: 'Settings' },
        slots: { default: 'Panel Body' },
      });

      expect(html).toContain('chrome-tui-block');
      expect(html).toContain('┌─');
      expect(html).toContain('Settings');
      expect(html).toContain('─┐');
      expect(html).toContain('chrome-std-block');
      expect(html).toContain('Panel Body');
    });

    it('renders TabBar with TUI multiplexer and Standard pill tabs', async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(TabBar, {
        props: {
          tabs: [
            { id: 'tab1', label: 'File Upload', active: true },
            { id: 'tab2', label: 'Settings', active: false },
          ],
        },
      });

      expect(html).toContain('chrome-tui-inline');
      expect(html).toContain('[1');
      expect(html).toContain('File Upload');
      expect(html).toContain('chrome-std-inline');
    });

    it('renders Input with TUI prompt line and Standard rounded field', async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(Input, {
        props: { placeholder: 'Enter username...', prompt: '>' },
      });

      expect(html).toContain('chrome-tui-inline');
      expect(html).toContain('&gt;');
      expect(html).toContain('chrome-std-block');
      expect(html).toContain('Enter username...');
    });

    it('renders LoadingIndicator with TUI blinking block cursor and Standard spinner', async () => {
      const container = await AstroContainer.create();
      const html = await container.renderToString(LoadingIndicator, {
        props: { text: 'Converting document' },
      });

      expect(html).toContain('chrome-tui-inline');
      expect(html).toContain('█');
      expect(html).toContain('chrome-std-inline');
      expect(html).toContain('animate-spin');
      expect(html).toContain('Converting document');
    });
  });
});
