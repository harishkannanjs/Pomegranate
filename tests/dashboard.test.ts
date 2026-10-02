import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, it, expect } from 'vitest';
import ProfilePage from '../src/pages/profile.astro';
import FileUploadTab from '../src/components/dashboard/FileUploadTab.astro';
import SettingsTab from '../src/components/dashboard/SettingsTab.astro';
import { siteConfig } from '../src/site.config';

describe('Phase 4: Dashboard Restructure Tests', () => {
  it('renders profile.astro dashboard with two primary tabs and mode-aware TabBar', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(ProfilePage);

    expect(result).toBeDefined();
    // Header brand and title
    expect(result).toContain('Pomegranate Dashboard');
    expect(result).toContain('DEV // LOCALHOST');

    // Tab navigation buttons
    expect(result).toContain('File Upload');
    expect(result).toContain('Settings');
    expect(result).toContain('Public Profile View');

    // Tab content panel containers
    expect(result).toContain('id="tab-content-file-upload"');
    expect(result).toContain('id="tab-content-settings"');
    expect(result).toContain('id="tab-content-public-profile"');
  });

  it('renders FileUploadTab with split editor, dropzone, and action CTAs', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(FileUploadTab);

    // Dropzone and conversion seam indicators
    expect(result).toContain('id="file-dropzone"');
    expect(result).toContain('Direct pass-through for');
    expect(result).toContain('Phase 5 conversion seam');

    // Action CTAs
    expect(result).toContain('Preview Blog site');
    expect(result).toContain('Save Post');
    expect(result).toContain('Push to GitHub');

    // Split editor panels
    expect(result).toContain('id="raw-markdown-input"');
    expect(result).toContain('id="rendered-markdown-output"');
    expect(result).toContain('Raw Markdown &amp; Frontmatter');
    expect(result).toContain('Rendered HTML Preview');

    // Modals
    expect(result).toContain('id="live-preview-modal"');
    expect(result).toContain('id="git-push-modal"');
  });

  it('renders SettingsTab with all 6 required sections and all 8 active feature toggles', async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(SettingsTab);

    // 1. Appearance section
    expect(result).toContain('Appearance &amp; Theming');
    expect(result).toContain('Active Theme Picker');
    expect(result).toContain('Typography / Font Picker');
    expect(result).toContain('data-theme-id="pomegranate"');
    expect(result).toContain('data-theme-id="catppuccin"');

    // 2. Features toggles
    expect(result).toContain('Reader Features');
    expect(result).toContain('data-feature-key="audioReader"');
    expect(result).toContain('data-feature-key="readerMode"');
    expect(result).toContain('data-feature-key="textMagnifier"');
    expect(result).toContain('data-feature-key="copyLink"');
    expect(result).toContain('data-feature-key="copyMarkdown"');
    expect(result).toContain('data-feature-key="tableOfContents"');
    expect(result).toContain('data-feature-key="readingProgressBar"');
    expect(result).toContain('data-feature-key="relatedPosts"');
    // Highlighter active in Phase 8
    expect(result).toContain('data-feature-key="highlighter"');

    // 3. Post Management section
    expect(result).toContain('Post Management');
    expect(result).toContain('id="posts-list-standalone"');
    expect(result).toContain('id="posts-list-series"');

    // 4. Deploy section & GitHub Device Flow (Phase 7 Multi-Target)
    expect(result).toContain('Deploy &amp; GitHub Authentication');
    expect(result).toContain('Multi-Target Deployment');
    expect(result).toContain('GitHub Pages');
    expect(result).toContain('Vercel');
    expect(result).toContain('Netlify');
    expect(result).toContain('Cloudflare Pages');
    expect(result).toContain('Connect GitHub (Device Flow)');

    // 5. Privacy section
    expect(result).toContain('Privacy &amp; Data Storage');
    expect(result).toContain('Visitor Data Explainer');
    expect(result).toContain('data-privacy-key="analytics"');
    expect(result).toContain('data-privacy-key="footerNote"');

    // 6. Advanced section
    expect(result).toContain('Advanced Operations');
    expect(result).toContain('Export Site as ZIP');
    expect(result).toContain('Undo Last Change (Git Revert)');
    expect(result).toContain('id="raw-config-editor"');
    expect(result).toContain('data-action="disconnect-github"');
    expect(result).toContain('Disconnect GitHub');
  });

  it('exposes features and privacy configurations in siteConfig', () => {
    expect(siteConfig.features).toBeDefined();
    expect(siteConfig.features?.audioReader).toBe(true);
    expect(siteConfig.features?.readerMode).toBe(true);
    expect(siteConfig.features?.textMagnifier).toBe(true);
    expect(siteConfig.features?.copyLink).toBe(true);
    expect(siteConfig.features?.copyMarkdown).toBe(true);
    expect(siteConfig.features?.tableOfContents).toBe(true);
    expect(siteConfig.features?.readingProgressBar).toBe(true);
    expect(siteConfig.features?.relatedPosts).toBe(true);
    expect(siteConfig.features?.highlighter).toBe(true);

    expect(siteConfig.privacy).toBeDefined();
    expect(siteConfig.privacy?.analytics).toBe(false);
    expect(siteConfig.privacy?.footerNote).toBe(true);
  });
});
