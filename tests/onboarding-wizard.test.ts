import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import OnboardingWizard from '../src/components/dashboard/OnboardingWizard.astro';
import { siteConfig } from '../src/site.config';
import fs from 'node:fs';
import path from 'node:path';

describe('First-Run Question-Based Onboarding Workflow', () => {
  it('renders all 4 question steps when onboarding is incomplete', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(OnboardingWizard, {
      props: {
        initialProfile: {
          onboardingCompleted: false,
          author: 'Your Name',
          handle: '@yourhandle',
        },
      },
    });

    expect(html).toBeDefined();

    // Container is active and not marked as completed
    expect(html).toContain('id="onboarding-wizard-overlay"');
    expect(html).toContain('data-onboarding-completed="false"');

    // Step 1: Identity questions
    expect(html).toContain('01 // Author Identity');
    expect(html).toContain('Who is publishing here?');
    expect(html).toContain('id="wizard-author-name"');
    expect(html).toContain('id="wizard-author-handle"');
    expect(html).toContain('id="wizard-blog-title"');
    expect(html).toContain('id="wizard-author-role"');

    // Step 2: Appearance & Typography questions
    expect(html).toContain('02 // Visual Signature');
    expect(html).toContain('Choose your palette & typography');
    expect(html).toContain('data-wizard-theme="pomegranate"');
    expect(html).toContain('data-wizard-theme="catppuccin"');
    expect(html).toContain('data-wizard-theme="gruvbox"');
    expect(html).toContain('id="wizard-font-select"');
    expect(html).toContain('id="wizard-mode-dark"');
    expect(html).toContain('id="wizard-mode-light"');

    // Step 3: Reader Features questions
    expect(html).toContain('03 // Reader Experience');
    expect(html).toContain('Configure visitor reader tools');
    expect(html).toContain('name="feature_highlighter"');
    expect(html).toContain('name="feature_readerMode"');
    expect(html).toContain('name="feature_audioReader"');
    expect(html).toContain('name="feature_tableOfContents"');

    // Step 4: Review and Initialize CTA
    expect(html).toContain('04 // Ready to Author');
    expect(html).toContain('Review setup and open dashboard');
    expect(html).toContain('id="btn-wizard-finish"');
    expect(html).toContain('Initialize Blog &amp; Launch Dashboard');
  });

  it('marks overlay as hidden when onboardingCompleted is true', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(OnboardingWizard, {
      props: {
        initialProfile: {
          onboardingCompleted: true,
          author: 'Alice Reed',
          handle: '@alicereed',
        },
      },
    });

    expect(html).toBeDefined();
    expect(html).toContain('data-onboarding-completed="true"');
    expect(html).toContain('hidden');
  });

  it('verifies onboarding component strictly resides under src/components/dashboard/', () => {
    const rootDir = process.cwd();
    const dashboardCompPath = path.join(
      rootDir,
      'src',
      'components',
      'dashboard',
      'OnboardingWizard.astro'
    );
    const publicPagesPath = path.join(rootDir, 'src', 'pages', 'OnboardingWizard.astro');

    expect(fs.existsSync(dashboardCompPath)).toBe(true);
    expect(fs.existsSync(publicPagesPath)).toBe(false);
  });

  it('siteConfig tracks onboardingCompleted property', () => {
    expect(typeof siteConfig.onboardingCompleted).toBe('boolean');
  });
});
