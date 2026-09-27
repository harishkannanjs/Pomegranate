import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect } from 'vitest';
import IndexPage from '../src/pages/index.astro';

describe('Homepage Smoke Test', () => {
  it('builds and renders the homepage including at least one PostCard', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(IndexPage);

    expect(result).toBeDefined();
    // Verify that the recent articles section and post cards are present
    expect(result).toContain('Recent Articles');
    // Check for PostCard elements: title or link or cat command or card article
    expect(result).toMatch(/<article\s+class="group relative flex flex-col/);
    expect(result).toContain('Welcome to glyph.sh');
    expect(result).toContain('blogly_');
  });
});
